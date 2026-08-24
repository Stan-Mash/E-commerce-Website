// POST /api/admin/products/upload-image
// Admin-only. Accepts multipart/form-data `file` (image/*, max 10 MB),
// returns { url } pointing at the public Supabase Storage object.

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const BUCKET   = "product-images";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED  = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
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

  const supabase = createAdminSupabaseClient();

  // Derive clean extension
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
    "image/gif":  "gif",
    "image/avif": "avif",
  };
  const ext = extMap[file.type] ?? "jpg";

  // Generate a collision-proof filename
  const timestamp = Date.now();
  const random    = Math.random().toString(36).slice(2, 8);
  const filename  = `${timestamp}-${random}.${ext}`;
  const path      = `products/${filename}`;

  // Convert File → Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert:      false,
      cacheControl: "public, max-age=31536000, immutable",
    });

  if (error) {
    // Bucket might not exist yet - try to create it and retry once
    if (error.message?.includes("Bucket not found") || error.message?.includes("bucket")) {
      await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED,
      });
      const { data: data2, error: error2 } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: file.type,
          upsert:      false,
          cacheControl: "public, max-age=31536000, immutable",
        });
      if (error2) {
        return NextResponse.json({ error: error2.message }, { status: 500 });
      }
      const { data: urlData2 } = supabase.storage.from(BUCKET).getPublicUrl(data2.path);
      return NextResponse.json({ url: urlData2.publicUrl });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl });
}
