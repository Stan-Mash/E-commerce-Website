// POST /api/admin/products/upload-video
// Admin-only. Accepts multipart/form-data `file` (video/*, max 100 MB),
// returns { url, path } pointing at the public Supabase Storage object.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

const BUCKET   = "product-videos";
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED  = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed: ${ALLOWED.join(", ")}` },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large. Max size is ${MAX_SIZE / 1024 / 1024} MB.` },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  const extMap: Record<string, string> = {
    "video/mp4":        "mp4",
    "video/webm":       "webm",
    "video/quicktime":  "mov",
    "video/ogg":        "ogv",
  };
  const ext = extMap[file.type] ?? "mp4";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `products/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadOpts = {
    contentType: file.type,
    upsert: false,
    cacheControl: "public, max-age=31536000, immutable",
  };

  let result = await supabase.storage.from(BUCKET).upload(path, buffer, uploadOpts);

  if (result.error && /bucket/i.test(result.error.message ?? "")) {
    // Bucket missing — create it (public) and retry once.
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED,
    });
    result = await supabase.storage.from(BUCKET).upload(path, buffer, uploadOpts);
  }

  if (result.error || !result.data) {
    return NextResponse.json({ error: result.error?.message ?? "Upload failed" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(result.data.path);
  return NextResponse.json({ url: urlData.publicUrl, path: result.data.path });
}
