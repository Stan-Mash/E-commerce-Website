/**
 * Notification worker - runs as a Vercel Cron Job every minute.
 *
 * State machine (strictly enforced):
 * queued → processing (claimed atomically via RPC with SKIP LOCKED)
 * processing → done (only after SMS API call succeeds)
 * processing → failed (only after SMS API call fails)
 *
 * Retries: jobs with status='failed' and attempts < 3 are re-queued
 * automatically by the claim_notification_jobs RPC.
 *
 * Security: Vercel sets Authorization: Bearer <CRON_SECRET> on every
 * cron invocation. We verify it before doing any work.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  sendSMS,
  orderConfirmationSMS,
  paymentFailedSMS,
  orderShippedSMS,
  orderReadyForPickupSMS,
} from "@/lib/africastalking/sms";
import {
  sendOrderConfirmationWA,
  sendPaymentFailedWA,
  sendOrderShippedWA,
  sendOrderReadyForPickupWA,
} from "@/lib/whatsapp/client";
import {
  sendEmail,
  isEmailConfigured,
  orderConfirmationEmail,
  orderShippedEmail,
} from "@/lib/email/client";

// WhatsApp is attempted first - higher open rates and free for 1k conversations/month.
// If WhatsApp is not configured or fails, we fall back to SMS automatically.
const WA_CONFIGURED =
  !!process.env.WHATSAPP_ACCESS_TOKEN &&
  !!process.env.WHATSAPP_PHONE_NUMBER_ID;

// Auth

function isAuthorised(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  // Allow unauthenticated in development; require secret in production
  if (!secret) return process.env.NODE_ENV !== "production";
  return auth === `Bearer ${secret}`;
}

// Types

interface NotificationJob {
  id: string;
  order_id: string;
  job_type: string;
  status: string;
  attempts: number;
}

interface OrderRow {
  order_ref: string;
  phone: string;
  total: number;
  status: string;
  email: string | null;
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
}

// Handler

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skipped: true, reason: "Supabase not configured" });
  }

  const supabase = createAdminSupabaseClient();

  // 1. Atomically claim queued jobs (SKIP LOCKED prevents double-processing)
  const { data: jobs, error: claimErr } = await supabase
    .rpc("claim_notification_jobs", { batch_size: 10 });

  if (claimErr) {
    console.error("[notifications-cron] Failed to claim jobs:", claimErr);
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  const claimed = (jobs ?? []) as NotificationJob[];

  if (claimed.length === 0) {
    return NextResponse.json({ processed: 0, message: "No pending jobs" });
  }

  // 2. Process each job
  const results: Array<{ id: string; job_type: string; success: boolean; error?: string }> = [];

  for (const job of claimed) {
    try {
      // Fetch the order this job belongs to
      // select * so optional migration-014 columns (email, tracking_*) resolve
      // even before the migration is applied.
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", job.order_id)
        .single();

      if (orderErr || !orderData) {
        await markFailed(supabase, job.id, `Order not found: ${job.order_id}`);
        results.push({ id: job.id, job_type: job.job_type, success: false, error: "Order not found" });
        continue;
      }

      const order = orderData as OrderRow;

      // Dispatch: WhatsApp first, SMS fallback
      let sent = false;
      let dispatchError = "";

      if (WA_CONFIGURED) {
        let waResult;
        switch (job.job_type) {
          case "order_confirmation":
            waResult = await sendOrderConfirmationWA(order.phone, "", order.order_ref, order.total);
            break;
          case "payment_failed":
            waResult = await sendPaymentFailedWA(order.phone, order.order_ref);
            break;
          case "order_shipped":
            waResult = await sendOrderShippedWA(order.phone, order.order_ref);
            break;
          case "order_ready_for_pickup":
            waResult = await sendOrderReadyForPickupWA(order.phone, order.order_ref);
            break;
          default:
            await markFailed(supabase, job.id, `Unknown job type: ${job.job_type}`);
            results.push({ id: job.id, job_type: job.job_type, success: false, error: "Unknown job type" });
            continue;
        }

        if (waResult.success) {
          sent = true;
        } else {
          // WhatsApp failed - log and fall through to SMS
          dispatchError = `WhatsApp: ${waResult.error ?? "failed"}`;
          console.warn(`[notifications-cron] WhatsApp failed for job ${job.id}, falling back to SMS. Error: ${waResult.error}`);
        }
      }

      // SMS fallback
      if (!sent) {
        let smsText: string;
        switch (job.job_type) {
          case "order_confirmation":
            smsText = orderConfirmationSMS(order.order_ref, order.total);
            break;
          case "payment_failed":
            smsText = paymentFailedSMS(order.order_ref);
            break;
          case "order_shipped":
            smsText = orderShippedSMS(order.order_ref);
            break;
          case "order_ready_for_pickup":
            smsText = orderReadyForPickupSMS(order.order_ref);
            break;
          default:
            await markFailed(supabase, job.id, `Unknown job type: ${job.job_type}`);
            results.push({ id: job.id, job_type: job.job_type, success: false, error: "Unknown job type" });
            continue;
        }

        const smsResult = await sendSMS(order.phone, smsText);
        if (smsResult.success) {
          sent = true;
        } else {
          dispatchError += ` | SMS: ${smsResult.error ?? "failed"}`;
        }
      }

      // Email as an additional best-effort channel (does not affect job status).
      if (isEmailConfigured() && order.email && (job.job_type === "order_confirmation" || job.job_type === "order_shipped")) {
        try {
          const tmpl = job.job_type === "order_confirmation"
            ? orderConfirmationEmail(order.order_ref, order.total)
            : orderShippedEmail(order.order_ref, order.courier ?? null, order.tracking_number ?? null, order.tracking_url ?? null);
          await sendEmail({ to: order.email, subject: tmpl.subject, html: tmpl.html });
        } catch (e) {
          console.warn(`[notifications-cron] email send failed for job ${job.id}:`, (e as Error).message);
        }
      }

      // Mark done or failed - worker ONLY sets this
      if (sent) {
        await supabase
          .from("notification_jobs")
          .update({ status: "done" })
          .eq("id", job.id);
        results.push({ id: job.id, job_type: job.job_type, success: true });
      } else {
        await markFailed(supabase, job.id, dispatchError || "All delivery channels failed");
        results.push({ id: job.id, job_type: job.job_type, success: false, error: dispatchError });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      await markFailed(supabase, job.id, message);
      results.push({ id: job.id, job_type: job.job_type, success: false, error: message });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`[notifications-cron] Processed ${claimed.length} jobs: ${succeeded} sent, ${failed} failed`);

  return NextResponse.json({
    processed: claimed.length,
    succeeded,
    failed,
    results,
  });
}

// Helpers

async function markFailed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  jobId: string,
  error: string
): Promise<void> {
  await supabase
    .from("notification_jobs")
    .update({ status: "failed", error })
    .eq("id", jobId);
}
