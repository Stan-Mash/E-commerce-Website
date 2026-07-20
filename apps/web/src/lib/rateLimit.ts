import type { NextRequest } from "next/server";

// Best-effort per-minute rate limiting for public endpoints. Enforced only when
// Upstash Redis is configured; otherwise it allows the request (no-op) so a
// store without Redis still works. Errors also fail open — this guards against
// abuse, it is not a hard security gate (checkout has its own stricter limiter).
export async function rateLimit(key: string, limitPerMinute = 20): Promise<boolean> {
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasRedis) return true;
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limitPerMinute, "1 m"),
      prefix: "esc-rl",
    });
    const { success } = await rl.limit(key);
    return success;
  } catch {
    return true;
  }
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

// Same fail-open behaviour as rateLimit() above, but with a 1-day sliding
// window — for per-day quotas (AI Stylist messages, try-on generations).
export async function rateLimitDaily(key: string, limitPerDay: number): Promise<boolean> {
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasRedis) return true;
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limitPerDay, "1 d"),
      prefix: "esc-rl-daily",
    });
    const { success } = await rl.limit(key);
    return success;
  } catch {
    return true;
  }
}
