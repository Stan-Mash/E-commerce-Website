import axios from "axios";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

/**
 * Pesapal API 3.0 integration for card + mobile-money checkout, with an eye
 * toward the in-store POS eventually using the same merchant account
 * (Pesapal is one of the few Kenyan providers that unifies online + physical
 * POS under one account — see docs/LAUNCH_CHECKLIST.md).
 *
 * Direct Safaricom Daraja STK push is still handled separately in
 * lib/mpesa/daraja.ts; Pesapal covers card + everything else via its hosted
 * checkout page, which the customer is redirected to.
 *
 * Configure via env:
 *   PESAPAL_CONSUMER_KEY      (server-only)
 *   PESAPAL_CONSUMER_SECRET   (server-only)
 *   PESAPAL_ENVIRONMENT       "sandbox" | "production" (defaults to sandbox)
 *
 * Reference: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json
 * NOTE: built against Pesapal's published API 3.0 docs but not yet
 * exercised against a live account (no credentials were available while
 * building this) — smoke-test one real checkout before relying on it in
 * production, same caveat as the FASHN try-on integration.
 */

const BASE_URL =
  process.env.PESAPAL_ENVIRONMENT === "production"
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";

export function isPesapalConfigured(): boolean {
  return !!process.env.PESAPAL_CONSUMER_KEY && !!process.env.PESAPAL_CONSUMER_SECRET;
}

// ── Access token (5-minute expiry per Pesapal's docs) ──────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 15_000) {
    return cachedToken.token;
  }

  const res = await axios.post<{ token: string; expiryDate: string; error?: unknown }>(
    `${BASE_URL}/Auth/RequestToken`,
    {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    },
    { headers: { Accept: "application/json", "Content-Type": "application/json" }, timeout: 15000 }
  );

  if (res.data.error || !res.data.token) {
    throw new Error("Pesapal auth failed: " + JSON.stringify(res.data.error ?? res.data));
  }

  // Cache for 4 minutes even though Pesapal grants ~5 — safety margin so we
  // never hand out a token that expires mid-request.
  cachedToken = { token: res.data.token, expiresAt: Date.now() + 4 * 60 * 1000 };
  return res.data.token;
}

// ── IPN registration (one-time per callback URL, cached in app_settings) ───
async function getOrRegisterIpnId(notificationUrl: string): Promise<string> {
  const supabase = createAdminSupabaseClient();

  const { data: existing } = await supabase
    .from("app_settings")
    .select("value")
    .eq("namespace", "payments")
    .eq("key", "pesapal_ipn_id")
    .maybeSingle();

  if (existing?.value) return existing.value;

  const token = await getAccessToken();
  const res = await axios.post<{ ipn_id: string; error?: unknown }>(
    `${BASE_URL}/URLSetup/RegisterIPN`,
    { url: notificationUrl, ipn_notification_type: "POST" },
    {
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      timeout: 15000,
    }
  );

  if (res.data.error || !res.data.ipn_id) {
    throw new Error("Pesapal IPN registration failed: " + JSON.stringify(res.data.error ?? res.data));
  }

  await supabase
    .from("app_settings")
    .upsert({ namespace: "payments", key: "pesapal_ipn_id", value: res.data.ipn_id }, { onConflict: "namespace,key" });

  return res.data.ipn_id;
}

// ── Submit order / get a redirect link ──────────────────────────────────
interface SubmitOrderArgs {
  orderRef: string; // our order_ref — becomes Pesapal's merchant_reference
  amount: number; // KES, whole number
  description: string;
  callbackUrl: string; // where Pesapal returns the customer after payment
  customerPhone: string; // 2547XXXXXXXX
  customerEmail?: string | undefined;
}

export interface PesapalOrderResult {
  redirectUrl: string;
  orderTrackingId: string;
}

export async function submitOrderRequest(args: SubmitOrderArgs): Promise<PesapalOrderResult> {
  if (!isPesapalConfigured()) {
    throw new Error("Pesapal is not configured");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://e-commerce-website-web.vercel.app";
  const notificationId = await getOrRegisterIpnId(`${siteUrl}/api/webhooks/pesapal`);
  const token = await getAccessToken();

  const payload = {
    id: args.orderRef,
    currency: "KES",
    amount: args.amount,
    description: args.description.slice(0, 100),
    callback_url: args.callbackUrl,
    notification_id: notificationId,
    billing_address: {
      phone_number: args.customerPhone,
      email_address: args.customerEmail || undefined,
      country_code: "KE",
    },
  };

  const res = await axios.post<{
    order_tracking_id: string;
    merchant_reference: string;
    redirect_url: string;
    error: unknown;
    status: string;
  }>(`${BASE_URL}/Transactions/SubmitOrderRequest`, payload, {
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    timeout: 20000,
  });

  if (res.data.error || !res.data.redirect_url) {
    throw new Error("Pesapal order submission failed: " + JSON.stringify(res.data.error ?? res.data));
  }

  return { redirectUrl: res.data.redirect_url, orderTrackingId: res.data.order_tracking_id };
}

// ── Transaction status (called from the IPN handler + redirect landing) ────
export interface PesapalStatusResult {
  statusCode: 0 | 1 | 2 | 3; // 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED
  statusDescription: string;
  amount: number;
  currency: string;
  merchantReference: string;
  confirmationCode: string | null;
  paymentMethod: string | null;
}

export async function getTransactionStatus(orderTrackingId: string): Promise<PesapalStatusResult> {
  const token = await getAccessToken();

  const res = await axios.get<{
    payment_method: string | null;
    amount: number;
    confirmation_code: string | null;
    payment_status_description: string;
    status_code: 0 | 1 | 2 | 3;
    merchant_reference: string;
    currency: string;
  }>(`${BASE_URL}/Transactions/GetTransactionStatus`, {
    params: { orderTrackingId },
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    timeout: 15000,
  });

  return {
    statusCode: res.data.status_code,
    statusDescription: res.data.payment_status_description,
    amount: res.data.amount,
    currency: res.data.currency,
    merchantReference: res.data.merchant_reference,
    confirmationCode: res.data.confirmation_code,
    paymentMethod: res.data.payment_method,
  };
}
