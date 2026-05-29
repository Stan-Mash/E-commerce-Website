/**
 * POST /api/admin/setup-images
 *
 * One-time setup endpoint. Call once after deploying the image-upload feature:
 *   1. Creates the `product-images` Supabase Storage bucket (public, 10 MB limit)
 *   2. Runs the `ALTER TABLE products ADD COLUMN image_url TEXT` migration via
 *      Supabase's pg-meta REST endpoint (available on all hosted projects).
 *
 * Idempotent — safe to call multiple times.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function checkAuth(request: NextRequest): boolean {
  const session = request.cookies.get("admin_session")?.value === "elite-admin-2024";
  const token   = request.cookies.get("admin_token")?.value   === "elite-admin-2024";
  const header  = request.headers.get("x-admin-token")        === "elite-admin-2024";
  return session || token || header;
}

const BUCKET        = "product-images";
const MIGRATION_SQL = `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`;

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: Record<string, string> = {};

  // ── 1. Create Storage bucket ──────────────────────────────────────────────
  try {
    const { data: existing } = await supabase.storage.listBuckets();
    const bucketExists = existing?.some((b) => b.name === BUCKET);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
      });
      results.bucket = error ? `error: ${error.message}` : "created";
    } else {
      results.bucket = "already exists";
    }
  } catch (e) {
    results.bucket = `exception: ${String(e)}`;
  }

  // ── 2. Run ALTER TABLE via pg-meta REST endpoint ──────────────────────────
  // Supabase hosts pg-meta at {project_url}/pg-meta/v0/query for all projects.
  // The service role JWT is accepted as the Bearer token.
  try {
    const pgMetaRes = await fetch(`${supabaseUrl}/pg-meta/v0/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });

    if (pgMetaRes.ok) {
      results.migration = "applied via pg-meta";
    } else {
      // pg-meta not available (self-hosted or restricted) — try via RPC function
      const rpcRes = await supabase.rpc("exec_ddl" as never, { sql: MIGRATION_SQL } as never);
      if (!(rpcRes as { error?: { message: string } }).error) {
        results.migration = "applied via rpc";
      } else {
        results.migration = "manual_required";
        results.migration_sql = MIGRATION_SQL;
      }
    }
  } catch (e) {
    results.migration = "manual_required";
    results.migration_sql = MIGRATION_SQL;
    results.migration_error = String(e);
  }

  const needsManual = results.migration === "manual_required";

  return NextResponse.json({
    ok: !needsManual,
    results,
    ...(needsManual && {
      action_required: `Run this SQL in your Supabase Dashboard → SQL Editor:\n\n${MIGRATION_SQL}`,
    }),
  });
}

// GET — for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request);
}
