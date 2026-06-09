import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const source = (body?.source ?? "footer").toString().slice(0, 40);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminSupabaseClient();
      // Upsert so re-subscribing is idempotent. Tolerate a missing table
      // (migration 014 not applied yet) so the signup UI never errors.
      const { error } = await supabase
        .from("newsletter_subscribers")
        .upsert({ email, source }, { onConflict: "email" });
      if (error && !/relation .* does not exist|could not find the table/i.test(error.message)) {
        console.error("[newsletter] persist error:", error.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
