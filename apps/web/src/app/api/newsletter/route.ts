import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email/client";

const WELCOME_DISCOUNT_PERCENT = 10;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `WELCOME10-${suffix}`;
}

/** Mint a single-use 10%-off promotion code, retrying on the rare code collision. */
async function mintDiscountCode(
  supabase: ReturnType<typeof createAdminSupabaseClient>
): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("promotions").insert({
      name: "Newsletter welcome offer",
      code,
      type: "percentage",
      value: WELCOME_DISCOUNT_PERCENT,
      max_uses: 1,
      active: true,
    });
    if (!error) return code;
    if (!/duplicate key|unique constraint/i.test(error.message)) {
      console.error("[newsletter] promotion insert error:", error.message);
      return null;
    }
    // Code collision — loop and try another.
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimit(`newsletter:${clientIp(req)}`, 5))) {
      return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
    }
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const source = (body?.source ?? "footer").toString().slice(0, 40);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    let discountCode: string | null = null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminSupabaseClient();

      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("discount_code")
        .eq("email", email)
        .maybeSingle();

      if (existing?.discount_code) {
        // Already subscribed with a code — re-send the same one, don't mint another.
        discountCode = existing.discount_code;
      } else {
        discountCode = await mintDiscountCode(supabase);
      }

      // Upsert so re-subscribing is idempotent. Tolerate a missing table
      // (migration 014 not applied yet) so the signup UI never errors.
      const { error } = await supabase
        .from("newsletter_subscribers")
        .upsert({ email, source, discount_code: discountCode }, { onConflict: "email" });
      if (error && !/relation .* does not exist|could not find the table/i.test(error.message)) {
        console.error("[newsletter] persist error:", error.message);
      }

      if (discountCode && !existing) {
        await sendEmail({
          to: email,
          subject: "Your 10% off Elite Style Co. code",
          html: `<p>Welcome to Elite Style Co. Use code <strong>${discountCode}</strong> for ${WELCOME_DISCOUNT_PERCENT}% off your first order.</p><p>This code is single-use — enter it at checkout.</p>`,
        }).catch(() => undefined); // best-effort; code is also returned in the response
      }
    }

    return NextResponse.json({ ok: true, code: discountCode });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
