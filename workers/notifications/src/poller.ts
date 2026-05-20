import type { Queue } from "bullmq";
import { supabase } from "./index";

/**
 * Polls Supabase for queued notification_jobs every 5 seconds
 * and enqueues them into BullMQ.
 *
 * IMPORTANT — race condition fix:
 *   We now use the `claim_notification_jobs` RPC instead of a plain SELECT.
 *   The RPC runs a single `UPDATE … WHERE status='queued' … FOR UPDATE SKIP LOCKED`
 *   statement and returns only the rows it atomically claimed.  This guarantees
 *   that even if two poller instances run simultaneously (e.g. during a deploy
 *   overlap) each job is claimed by exactly one instance.
 *
 * State machine (strictly enforced):
 *   queued → processing  (claimed inside the RPC)
 *   processing → done    (only after the BullMQ worker completes — the Vercel
 *                         Cron handler marks done; this poller enqueues only)
 *   processing → failed  (marked by the BullMQ worker on final retry)
 *
 * The poller itself does NOT mark jobs done — BullMQ workers are responsible
 * for the processing → done/failed transition after the actual SMS/WhatsApp
 * call completes.  Marking done before the API call (the previous bug) caused
 * silent drops when the API call subsequently failed.
 */
export async function pollNotificationQueue(queue: Queue): Promise<never> {
  while (true) {
    try {
      // Atomically claim up to 50 queued jobs (SKIP LOCKED prevents
      // double-processing across concurrent poller instances).
      const { data: jobs, error } = await supabase.rpc(
        "claim_notification_jobs",
        { batch_size: 50 }
      );

      if (error) throw error;

      for (const job of (jobs ?? []) as Array<{ id: string; order_id: string; job_type: string }>) {
        // Enqueue into BullMQ.  The worker marks done/failed after the
        // actual notification API call — we do NOT update status here.
        await queue.add(
          job.job_type,
          { orderId: job.order_id, jobId: job.id },
          {
            jobId: job.id,   // idempotent — BullMQ deduplicates by jobId
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          }
        );
      }
    } catch (err) {
      console.error("[poller] Error polling notification_jobs:", (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}
