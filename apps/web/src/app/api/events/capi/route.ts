import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// ── Env ───────────────────────────────────────────────────────────────────────
const META_PIXEL_ID   = process.env.META_PIXEL_ID ?? "";
const META_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
const TT_PIXEL_ID     = process.env.TIKTOK_PIXEL_ID ?? "";
const TT_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN ?? "";
const CAPI_SECRET     = process.env.CAPI_ENDPOINT_SECRET ?? "";

// ── Schema ────────────────────────────────────────────────────────────────────
const Schema = z.object({
  event_name: z.string().min(1).max(100),
  event_id:   z.string().min(1).max(200),
  platforms:  z.array(z.enum(["meta", "tiktok"])).min(1),
  event_time: z.number().int().optional(),
  user: z.object({
    email:   z.string().optional(),
    phone:   z.string().optional(),
    fbp:     z.string().optional(),
    fbc:     z.string().optional(),
    ip:      z.string().optional(),
    ua:      z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  custom_data: z.record(z.unknown()).optional(),
  event_source_url: z.string().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sha256(value: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(value.trim().toLowerCase()));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendMeta(payload: z.infer<typeof Schema>, ip: string, ua: string) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return { ok: false, error: "Meta CAPI not configured" };

  const user_data: Record<string, string | undefined> = {
    client_ip_address: payload.user?.ip ?? ip,
    client_user_agent: payload.user?.ua ?? ua,
    fbp: payload.user?.fbp,
    fbc: payload.user?.fbc,
  };
  if (payload.user?.email) user_data.em = await sha256(payload.user.email);
  if (payload.user?.phone) user_data.ph = await sha256(payload.user.phone.replace(/\D/g, ""));

  const body = {
    data: [{
      event_name: payload.event_name,
      event_id:   payload.event_id,
      event_time: payload.event_time ?? Math.floor(Date.now() / 1000),
      event_source_url: payload.event_source_url,
      action_source: "website",
      user_data,
      custom_data: payload.custom_data,
    }],
  };

  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const d = await r.json() as unknown;
    return { ok: r.ok, response: d };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function sendTikTok(payload: z.infer<typeof Schema>, ip: string, ua: string) {
  if (!TT_PIXEL_ID || !TT_ACCESS_TOKEN) return { ok: false, error: "TikTok Events API not configured" };

  const properties: Record<string, unknown> = {
    ...(payload.custom_data ?? {}),
  };

  const userProps: Record<string, string | undefined> = {
    ip: payload.user?.ip ?? ip,
    user_agent: payload.user?.ua ?? ua,
  };
  if (payload.user?.email) userProps.email = await sha256(payload.user.email);
  if (payload.user?.phone) userProps.phone_number = await sha256(payload.user.phone.replace(/\D/g, ""));

  const body = {
    pixel_code: TT_PIXEL_ID,
    events: [{
      event: payload.event_name,
      event_id: payload.event_id,
      timestamp: new Date((payload.event_time ? payload.event_time * 1000 : Date.now())).toISOString(),
      page: { url: payload.event_source_url },
      user: userProps,
      properties,
    }],
  };

  try {
    const r = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": TT_ACCESS_TOKEN },
      body: JSON.stringify(body),
    });
    const d = await r.json() as unknown;
    return { ok: r.ok, response: d };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const POST = withApiErrorHandling("capi POST", async (request: NextRequest) => {
  // Optional shared secret for server-to-server calls
  if (CAPI_SECRET) {
    const secret = request.headers.get("x-capi-secret");
    if (secret !== CAPI_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ua = request.headers.get("user-agent") ?? "";

  const body = await request.json() as unknown;
  const data = Schema.parse(body);

  const results: Record<string, unknown> = {};

  if (data.platforms.includes("meta")) {
    results.meta = await sendMeta(data, ip, ua);
  }
  if (data.platforms.includes("tiktok")) {
    results.tiktok = await sendTikTok(data, ip, ua);
  }

  // Log to DB (best-effort)
  try {
    const supabase = createAdminSupabaseClient();
    const platform = data.platforms.length === 2 ? "both" : data.platforms[0]!;
    const ok = Object.values(results).every((r) => (r as { ok: boolean }).ok);
    await supabase.from("capi_events").insert({
      event_name:    data.event_name,
      event_id:      data.event_id,
      platform,
      payload_json:  data as unknown as Record<string, unknown>,
      status:        ok ? "sent" : "failed",
      response_json: results as Record<string, unknown>,
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, results });
});
