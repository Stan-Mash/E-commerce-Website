/**
 * Abandoned cart recovery cron — fires every 30 minutes on Vercel Cron.
 *
 * Recovery stages:
 *   0 → 1  : 60 min after last_activity  (first reminder)
 *   1 → 2  : 24 h  after last_activity  (second reminder)
 *   2 → 3  : 48 h  after last_activity  (final reminder + discount)
 *   3+     : expire after 72 h
 *
 * Auth: Vercel sets Authorization: Bearer <CRON_SECRET> on every invocation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elitestyle.co.ke";
const WA_NUMBER   = "254142424802";

// Stage thresholds in hours
const STAGES = [
  { from: 0, hours: 1  },
  { from: 1, hours: 24 },
  { from: 2, hours: 48 },
];

interface AbandonedCart {
  id: string;
  restore_token: string;
  phone: string | null;
  email: string | null;
  cart_json: CartItem[];
  subtotal_kes: number;
  recovery_stage: number;
  last_activity: string;
}

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);
}

function buildWhatsAppUrl(phone: string, message: string) {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

function cartSummary(items: CartItem[]): string {
  return items.slice(0, 3).map((i) => `• ${i.name}${i.size ? ` (${i.size})` : ""} × ${i.quantity}`).join("\n");
}

function waMessage(cart: AbandonedCart, stage: number): string {
  const restoreUrl = `${SITE_URL}/cart/restore?token=${cart.restore_token}`;
  const summary = cartSummary(cart.cart_json);

  if (stage === 1) {
    return `Hi! You left something behind at Elite Style Co. 🛍️\n\n${summary}\n\nTotal: ${formatKES(cart.subtotal_kes)}\n\nCome back and complete your order:\n${restoreUrl}`;
  }
  if (stage === 2) {
    return `Still thinking it over? Your cart at Elite Style Co. is waiting 👗\n\n${summary}\n\nTotal: ${formatKES(cart.subtotal_kes)}\n\nWe have limited stock — tap to complete your order:\n${restoreUrl}`;
  }
  return `Last chance! Your Elite Style Co. cart expires soon ⏳\n\n${summary}\n\nTotal: ${formatKES(cart.subtotal_kes)}\n\nUse code COMEBACK10 for 10% off — expires in 24 hrs:\n${restoreUrl}`;
}

export async function GET(req: NextRequest) {
  // Verify Vercel Cron auth — fail closed: no secret in production = deny all.
  const auth = req.headers.get("authorization") ?? "";
  const isDev = process.env.NODE_ENV !== "production";
  if (!CRON_SECRET) {
    if (!isDev) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  } else if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();

  let processed = 0;
  let errors = 0;

  for (const stage of STAGES) {
    const cutoff = new Date(now.getTime() - stage.hours * 60 * 60 * 1000).toISOString();

    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("id, restore_token, phone, email, cart_json, subtotal_kes, recovery_stage, last_activity")
      .eq("status", "active")
      .eq("recovery_stage", stage.from)
      .lt("last_activity", cutoff)
      .limit(50);

    if (error) { errors++; continue; }
    if (!carts?.length) continue;

    for (const cart of (carts as AbandonedCart[])) {
      const nextStage = stage.from + 1;

      // Send WhatsApp recovery message if phone is available
      if (cart.phone) {
        const cleanPhone = cart.phone.replace(/\D/g, "").replace(/^0/, "254");
        const msg = waMessage(cart, nextStage);
        // Fire-and-forget: open WhatsApp Business API if configured, else log only
        const waApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
        const waPhoneId  = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (waApiToken && waPhoneId) {
          void fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${waApiToken}` },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhone,
              type: "text",
              text: { body: msg },
            }),
          }).catch(() => null);
        } else {
          // WhatsApp Business API not configured — log the recovery intent
          console.log(`[cart-recovery] Would send WA to ${cleanPhone} (stage ${nextStage}): ${buildWhatsAppUrl(WA_NUMBER, msg)}`);
        }
      }

      // Advance the stage
      const { error: updateErr } = await supabase
        .from("abandoned_carts")
        .update({ recovery_stage: nextStage, ...(nextStage >= 3 ? { status: "expired" } : {}) })
        .eq("id", cart.id);

      if (updateErr) { errors++; } else { processed++; }
    }
  }

  // Expire carts that have passed 72 hours without recovery
  const expiryCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("abandoned_carts")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("last_activity", expiryCutoff);

  return NextResponse.json({ ok: true, processed, errors });
}
