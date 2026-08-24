import type { NextRequest } from "next/server";

// Per-minute rate limiting for public endpoints (including admin/owner login).
// Enforced when Upstash Redis is configured. In development, a missing Redis
// or a Redis error allows the request through (no-op) so a store without Redis
// still works locally. In production, a missing/erroring Redis fails CLOSED —
// silently disabling rate limiting (e.g. on login) would remove brute-force
// protection with no signal that anything changed.
export async function rateLimit(key: string, limitPerMinute = 20): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasRedis) {
    if (isDev) return true;
    console.error("[rateLimit] Rate limiting required in production but UPSTASH env vars are missing.");
    return false;
  }
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
  } catch (err) {
    console.error("[rateLimit] Rate limit check threw:", (err as Error).message);
    return isDev;
  }
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

// Same fail-closed-in-production behaviour as rateLimit() above, but with a
// 1-day sliding window — for per-day quotas (AI Stylist messages, try-on
// generations).
export async function rateLimitDaily(key: string, limitPerDay: number): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasRedis) {
    if (isDev) return true;
    console.error("[rateLimitDaily] Rate limiting required in production but UPSTASH env vars are missing.");
    return false;
  }
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
  } catch (err) {
    console.error("[rateLimitDaily] Rate limit check threw:", (err as Error).message);
    return isDev;
  }
}
