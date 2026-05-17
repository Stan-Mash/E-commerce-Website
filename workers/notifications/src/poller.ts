import type { Queue } from "bullmq";
import { supabase } from "./index";

/**
 * Polls Supabase for queued notification_jobs every 5 seconds
 * and enqueues them into BullMQ.
 *
 * This decouples the webhook handler (which writes to Postgres)
 * from Redis — useful when the web app can't reach Redis directly.
 */
export async function pollNotificationQueue(queue: Queue): Promise<never> {
  while (true) {
    try {
      const { data: jobs, error } = await supabase
        .from("notification_jobs")
        .select("id, order_id, job_type")
        .eq("status", "queued")
        .limit(50);

      if (error) throw error;

      for (const job of jobs ?? []) {
        // Mark as processing before enqueuing to prevent double processing
        await supabase
          .from("notification_jobs")
          .update({ status: "processing", attempts: 1 })
          .eq("id", job.id);

        await queue.add(
          job.job_type,
          { orderId: job.order_id },
          {
            jobId: job.id,  // idempotent — BullMQ deduplicates by jobId
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          }
        );

        // Mark done after BullMQ accepts (BullMQ handles retries internally)
        await supabase
          .from("notification_jobs")
          .update({ status: "done" })
          .eq("id", job.id);
      }
    } catch (err) {
      console.error("[poller] Error polling notification_jobs:", (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}
