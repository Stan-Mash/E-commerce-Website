/**
 * Africa's Talking SMS client
 * Docs: https://developers.africastalking.com/docs/sms/sending
 *
 * Required env vars:
 *   AFRICASTALKING_API_KEY      — from your AT dashboard
 *   AFRICASTALKING_USERNAME     — your AT account username (use "sandbox" for testing)
 *   AFRICASTALKING_SENDER_ID    — optional short-code / sender name (e.g. "EliteStyle")
 */

const AT_BASE_URL = "https://api.africastalking.com/version1";
const AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1";

function getBaseUrl() {
  return process.env.AFRICASTALKING_USERNAME === "sandbox"
    ? AT_SANDBOX_URL
    : AT_BASE_URL;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS to a single Kenyan phone number.
 * @param to   Phone in 254XXXXXXXXX format
 * @param text Message body (max 160 chars for single SMS)
 */
export async function sendSMS(to: string, text: string): Promise<SMSResult> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    return { success: false, error: "Africa's Talking credentials not configured" };
  }

  const params = new URLSearchParams({
    username,
    to,
    message: text.slice(0, 160),
    ...(process.env.AFRICASTALKING_SENDER_ID
      ? { from: process.env.AFRICASTALKING_SENDER_ID }
      : {}),
  });

  try {
    const res = await fetch(`${getBaseUrl()}/messaging`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `AT API ${res.status}: ${text}` };
    }

    const json = await res.json() as {
      SMSMessageData: {
        Message: string;
        Recipients: Array<{ status: string; messageId: string; statusCode: number }>;
      };
    };

    const recipient = json.SMSMessageData.Recipients[0];
    if (!recipient || recipient.statusCode !== 101) {
      return {
        success: false,
        error: `AT delivery failed: ${recipient?.status ?? "no recipient"}`,
      };
    }

    return { success: true, messageId: recipient.messageId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── SMS templates ─────────────────────────────────────────────────────────────

export function orderConfirmationSMS(orderRef: string, total: number): string {
  const kes = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(total);
  return `Elite Style Co: Order ${orderRef} confirmed! Total: ${kes}. We'll notify you when it ships. Thank you for shopping with us.`;
}

export function paymentFailedSMS(orderRef: string): string {
  return `Elite Style Co: Payment for order ${orderRef} was not completed. Please try again at e-commerce-website-web.vercel.app or contact us for help.`;
}

export function orderShippedSMS(orderRef: string): string {
  return `Elite Style Co: Great news! Order ${orderRef} is on its way. You'll receive it within 1-3 business days. Track your order on our website.`;
}

export function orderReadyForPickupSMS(orderRef: string): string {
  return `Elite Style Co: Order ${orderRef} is ready for pickup at our store. Please bring this message as confirmation. See you soon!`;
}
