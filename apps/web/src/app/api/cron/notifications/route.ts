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
  cartReminderSMS,
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
  cartReminderEmail,
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

  // 0. Enqueue abandoned-cart reminders for orders left unpaid.
  await enqueueCartReminders(supabase);

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
          case "cart_reminder":
            // No approved WhatsApp template for marketing reminders; use SMS/email.
            waResult = { success: false, error: "cart_reminder uses SMS/email" };
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
          case "cart_reminder":
            smsText = cartReminderSMS(order.order_ref, order.total);
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
      const EMAILABLE = ["order_confirmation", "order_shipped", "cart_reminder"];
      if (isEmailConfigured() && order.email && EMAILABLE.includes(job.job_type)) {
        try {
          const tmpl =
            job.job_type === "order_confirmation" ? orderConfirmationEmail(order.order_ref, order.total)
            : job.job_type === "cart_reminder"     ? cartReminderEmail(order.order_ref, order.total)
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

// Queue one cart_reminder per order that's been stuck in pending_payment for
// 30 min – 48 h and hasn't already been reminded. Best-effort; never throws.
async function enqueueCartReminders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  try {
    const now = Date.now();
    const from = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    const to = new Date(now - 30 * 60 * 1000).toISOString();

    const { data: stale } = await supabase
      .from("orders")
      .select("id, phone")
      .eq("status", "pending_payment")
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(100);

    if (!stale || stale.length === 0) return;

    const ids = stale.map((o: { id: string }) => o.id);
    const { data: already } = await supabase
      .from("notification_jobs")
      .select("order_id")
      .eq("job_type", "cart_reminder")
      .in("order_id", ids);

    const remindedIds = new Set((already ?? []).map((r: { order_id: string }) => r.order_id));
    const toInsert = stale
      .filter((o: { id: string; phone: string }) => o.phone && !remindedIds.has(o.id))
      .map((o: { id: string }) => ({ order_id: o.id, job_type: "cart_reminder", status: "queued" }));

    if (toInsert.length > 0) {
      await supabase.from("notification_jobs").insert(toInsert);
    }
  } catch (e) {
    console.warn("[notifications-cron] cart reminder enqueue failed:", (e as Error).message);
  }
}

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
