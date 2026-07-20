import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getTryOnProvider, isTryOnConfigured, isCategoryEligibleForTryOn } from "@/lib/tryon/provider";
import { rateLimitDaily, clientIp } from "@/lib/rateLimit";

const SESSION_COOKIE = "es_tryon_session";
const BUCKET = "tryon-uploads";
const MAX_SIZE = 8 * 1024 * 1024; // 8MB — client already downscales to <=1024px before upload
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FREE_ANONYMOUS_TRIES = 2;
const IP_DAILY_CAP = 10; // defense-in-depth abuse guard, independent of the per-session cap
const SIGNED_URL_TTL_SECONDS = 600;

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  if (!isTryOnConfigured()) {
    return NextResponse.json({ ok: false, error: "Try-on is temporarily unavailable." }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Try-on is temporarily unavailable." }, { status: 503 });
  }

  let sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const isNewSession = !sessionId;
  if (!sessionId) sessionId = randomUUID();

  if (!(await rateLimitDaily(`tryon-ip:${clientIp(req)}`, IP_DAILY_CAP))) {
    return NextResponse.json({ ok: false, error: "Too many requests today. Please try again tomorrow." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const consent = formData.get("consent");
  if (consent !== "true") {
    return NextResponse.json({ ok: false, error: "Consent is required to use Try-On." }, { status: 400 });
  }
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ ok: false, error: "Missing product." }, { status: 400 });
  }
  const file = formData.get("photo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "No photo provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "Please upload a JPEG, PNG, or WebP photo." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "Photo is too large." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, category, product_images(url, sort_order)")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }
  if (!isCategoryEligibleForTryOn(product.category)) {
    return NextResponse.json({ ok: false, error: "Try-on isn't available for this item." }, { status: 400 });
  }
  const garmentImageUrl = (product.product_images as { url: string; sort_order: number }[] | null)
    ?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  if (!garmentImageUrl) {
    return NextResponse.json({ ok: false, error: "This item has no image to try on." }, { status: 400 });
  }

  // Session try-count cap (anonymous free tier — no account system exists yet
  // to escalate to per the original 2-free/10-per-day-account spec, so this
  // enforces a flat per-session cap instead).
  const { count: usedCount } = await supabase
    .from("tryon_uploads")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);
  if ((usedCount ?? 0) >= FREE_ANONYMOUS_TRIES) {
    return NextResponse.json(
      { ok: false, error: "You've used your free try-ons for this session." },
      { status: 429 }
    );
  }

  // Same session + same product within 24h → reuse the cached result instead
  // of calling the provider (and spending money) again.
  const { data: cached } = await supabase
    .from("tryon_uploads")
    .select("id, status, result_path")
    .eq("session_id", sessionId)
    .eq("product_id", productId)
    .eq("status", "completed")
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ ok: true, id: cached.id, cached: true, status: "completed", resultUrl: cached.result_path });
  }

  const storage = getServiceClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${sessionId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let uploadResult = await storage.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadResult.error?.message?.toLowerCase().includes("bucket")) {
    await storage.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_SIZE, allowedMimeTypes: ALLOWED_TYPES });
    uploadResult = await storage.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  }
  if (uploadResult.error) {
    return NextResponse.json({ ok: false, error: "Could not process your photo. Please try again." }, { status: 500 });
  }

  const { data: signed } = await storage.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (!signed?.signedUrl) {
    return NextResponse.json({ ok: false, error: "Could not process your photo. Please try again." }, { status: 500 });
  }

  const provider = getTryOnProvider();
  const genResult = await provider.generate({ personImageUrl: signed.signedUrl, garmentImageUrl });
  if (!genResult.ok) {
    return NextResponse.json({ ok: false, error: "The stylist AI is unavailable right now. Please try again shortly." }, { status: 502 });
  }

  const { data: row, error: insertError } = await supabase
    .from("tryon_uploads")
    .insert({
      session_id: sessionId,
      product_id: productId,
      upload_path: path,
      provider_job_id: genResult.jobId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return NextResponse.json({ ok: false, error: "Could not start your try-on. Please try again." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, id: row.id, status: "pending" });
  if (isNewSession) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }
  return response;
}
