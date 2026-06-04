import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@nairobi-fashion/lib";
import { sendOrderConfirmation } from "./jobs/orderConfirmation";
import { sendPaymentFailed } from "./jobs/paymentFailed";
import { pollNotificationQueue } from "./poller";

const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const QUEUE_NAME = "notifications";

export const notificationQueue = new Queue(QUEUE_NAME, { connection: redis });

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[worker] Processing job ${job.id} type=${job.name}`);

    switch (job.name) {
      case "order_confirmation":
        await sendOrderConfirmation(job.data as { orderId: string });
        break;
      case "payment_failed":
        await sendPaymentFailed(job.data as { orderId: string });
        break;
      default:
        console.warn(`[worker] Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redis,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

// Poll Supabase notification_jobs table for new queued jobs
// (fallback for jobs created by the webhook handler without direct Redis access)
pollNotificationQueue(notificationQueue).catch(console.error);

console.log("[worker] Notification worker started");
