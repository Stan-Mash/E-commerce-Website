import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

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
