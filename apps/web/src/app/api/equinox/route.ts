import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { SUPPORT_EMAIL } from "@/lib/supportConfig";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const EquinoxSchema = z.object({
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(20).optional(),
});

// Stores Equinox Edit "Reserve Access" submissions in equinox_reservations
// (migration 023) — separate from the newsletter list since this is a
// one-time private-preview waitlist, not a recurring subscription.
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`equinox:${clientIp(req)}`, 5))) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = EquinoxSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email." }, { status: 422 });
  }
  const { email, phone } = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("equinox_reservations").insert({
      email,
      phone: phone || null,
    });
    if (error) {
      console.error("[equinox] DB insert failed:", error.message);
      return NextResponse.json({ ok: false, error: "Could not reserve your spot. Please try again." }, { status: 500 });
    }
  } catch (err) {
    console.error("[equinox] Error storing reservation:", err);
    return NextResponse.json({ ok: false, error: "Could not reserve your spot. Please try again." }, { status: 500 });
  }

  if (isEmailConfigured()) {
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: "[Equinox Edit] New reservation",
      html: `<p>${email}${phone ? ` &middot; ${phone}` : ""}</p>`,
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
