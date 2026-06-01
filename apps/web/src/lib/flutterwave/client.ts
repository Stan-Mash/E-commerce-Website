import axios from "axios";

/**
 * Flutterwave integration for card + local-method payments (cards, Airtel
 * Money, bank, and M-Pesa via Flutterwave's hosted checkout).
 *
 * Direct Safaricom Daraja STK push is still handled separately in
 * lib/mpesa/daraja.ts; Flutterwave covers everything else and acts as the
 * card processor.
 *
 * Configure via env:
 *   FLUTTERWAVE_SECRET_KEY              (server-only)
 *   NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY  (client, used by inline JS if needed)
 *   FLUTTERWAVE_WEBHOOK_HASH            (verify-hash header on webhooks)
 *
 * If the secret key is missing/placeholder, isFlutterwaveConfigured() returns
 * false so the UI can hide card payment instead of erroring.
 */
const BASE_URL = "https://api.flutterwave.com/v3";

export function isFlutterwaveConfigured(): boolean {
  const key = process.env.FLUTTERWAVE_SECRET_KEY ?? "";
  return key.startsWith("FLWSECK") && !key.includes("xxxxxxxx");
}

interface CreatePaymentLinkArgs {
  txRef: string;          // our order_ref — used to reconcile in the webhook
  amount: number;         // KES, whole number
  customerPhone: string;  // 2547XXXXXXXX
  customerEmail?: string | undefined;
  redirectUrl: string;    // where FW returns the customer after payment
  /** Restrict to certain methods, e.g. ["card","mpesa","mobilemoneyfranco"]. */
  paymentOptions?: string | undefined;
  title?: string | undefined;
}

export interface FlutterwaveLinkResult {
  link: string;
}

export async function createPaymentLink(
  args: CreatePaymentLinkArgs
): Promise<FlutterwaveLinkResult> {
  if (!isFlutterwaveConfigured()) {
    throw new Error("Flutterwave is not configured");
  }

  const payload = {
    tx_ref: args.txRef,
    amount: args.amount,
    currency: "KES",
    redirect_url: args.redirectUrl,
    payment_options: args.paymentOptions ?? "card,mpesa,mobilemoneyfranco,banktransfer,ussd",
    customer: {
      email: args.customerEmail || `${args.customerPhone}@elitestyle.co.ke`,
      phonenumber: args.customerPhone,
    },
    customizations: {
      title: args.title ?? "Elite Style Co.",
      description: "Order payment",
    },
  };

  const res = await axios.post<{ status: string; data: { link: string } }>(
    `${BASE_URL}/payments`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  if (res.data.status !== "success" || !res.data.data?.link) {
    throw new Error("Flutterwave did not return a payment link");
  }
  return { link: res.data.data.link };
}

export interface FlutterwaveVerifyResult {
  status: string;        // "successful" | ...
  amount: number;
  currency: string;
  txRef: string;
}

/** Server-side transaction verification (called from the webhook / redirect). */
export async function verifyTransaction(
  transactionId: string | number
): Promise<FlutterwaveVerifyResult> {
  const res = await axios.get<{
    status: string;
    data: { status: string; amount: number; currency: string; tx_ref: string };
  }>(`${BASE_URL}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    timeout: 15000,
  });

  const d = res.data.data;
  return {
    status: d.status,
    amount: d.amount,
    currency: d.currency,
    txRef: d.tx_ref,
  };
}
