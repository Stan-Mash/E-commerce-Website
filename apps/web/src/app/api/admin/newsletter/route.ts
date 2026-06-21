import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { isEmailConfigured } from "@/lib/email/client";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const MISSING_TABLE = /relation .* does not exist|could not find the table/i;

// GET /api/admin/newsletter         -> { subscribers, migrated }
// GET /api/admin/newsletter?format=csv -> CSV download
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ subscribers: [], migrated: false });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // Table not created yet (migration 014 not applied) — return an empty,
    // explained state instead of a 500 so the admin page renders cleanly.
    if (MISSING_TABLE.test(error.message)) {
      return NextResponse.json({ subscribers: [], migrated: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const subscribers = data ?? [];

  if (request.nextUrl.searchParams.get("format") === "csv") {
    const rows = [
      "email,source,subscribed_at",
      ...subscribers.map((s) => `${s.email},${s.source ?? ""},${s.created_at}`),
    ].join("\n");
    return new NextResponse(rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
      },
    });
  }

  return NextResponse.json({ subscribers, migrated: true });
}

// POST /api/admin/newsletter  { subject, html } -> send campaign to all subscribers
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured. Add RESEND_API_KEY and EMAIL_FROM to Vercel env vars." }, { status: 503 });
  }

  const body = await request.json() as { subject?: string; html?: string };
  const { subject, html } = body;
  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "subject and html are required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const emails = (data ?? []).map((r: { email: string }) => r.email);
  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  // Resend batch API — up to 100 per request
  const BATCH_SIZE = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE).map((to: string) => ({
      from: process.env.EMAIL_FROM!,
      to: [to],
      subject,
      html,
    }));

    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      sent += batch.length;
    } else {
      failed += batch.length;
    }
  }

  return NextResponse.json({ sent, failed });
}
