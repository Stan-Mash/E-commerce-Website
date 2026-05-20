import axios from "axios";

const BASE_URL =
  process.env.MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const TOKEN_CACHE_KEY = "mpesa_access_token";
const TOKEN_TTL_SECONDS = 3400; // Daraja tokens expire after 3599s; refresh at 3400s to be safe

async function getAccessToken(): Promise<string> {
  // Try Redis cache first (only if Upstash is configured)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      const cached = await redis.get<string>(TOKEN_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // Redis unavailable — fall through to fresh token
    }
  }

  // Fetch fresh token from Safaricom
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get<{ access_token: string }>(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  const token = res.data.access_token;

  // Cache in Redis for TOKEN_TTL_SECONDS
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      await redis.set(TOKEN_CACHE_KEY, token, { ex: TOKEN_TTL_SECONDS });
    } catch {
      // Cache failure is non-fatal
    }
  }

  return token;
}

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
}

function getPassword(timestamp: string): string {
  const { MPESA_SHORTCODE, MPESA_PASSKEY } = process.env;
  return Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");
}

export interface STKPushParams {
  phone: string;         // 254XXXXXXXXX format
  amount: number;        // KES, integer
  orderId: string;       // used as AccountReference
  description: string;  // max 20 chars
}

export interface STKPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateSTKPush(params: STKPushParams): Promise<STKPushResult> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amount),
    PartyA: params.phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: params.phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: params.orderId.slice(0, 12),
    TransactionDesc: params.description.slice(0, 20),
  };

  const res = await axios.post<STKPushResult>(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

export interface STKCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;   // 0 = success
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

export function parseSTKCallback(body: STKCallbackBody) {
  const cb = body.Body.stkCallback;
  const items = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    success: cb.ResultCode === 0,
    resultDesc: cb.ResultDesc,
    mpesaReceiptNumber: get("MpesaReceiptNumber") as string | undefined,
    amount: get("Amount") as number | undefined,
    phoneNumber: get("PhoneNumber") as string | undefined,
    transactionDate: get("TransactionDate") as string | undefined,
  };
}
