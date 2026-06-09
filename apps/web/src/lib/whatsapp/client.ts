// Meta WhatsApp Cloud API client.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// Env: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
// Business-initiated messages need pre-approved templates (names below must
// match Meta Business Suite exactly). Within the 24h customer window,
// sendTextMessage() can be used instead.

const GRAPH_URL = "https://graph.facebook.com/v19.0";

export interface WhatsAppResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

// Core send function
async function sendWhatsApp(payload: Record<string, unknown>): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { success: false, error: "WhatsApp credentials not configured" };
  }

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });

    const json = await res.json() as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code: number };
    };

    if (!res.ok || json.error) {
      return {
        success: false,
        error: json.error?.message ?? `HTTP ${res.status}`,
      };
    }

    return { success: true, messageId: json.messages?.[0]?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Template messages (production; requires Meta approval)
/**
 * Order confirmation template.
 * Create in Meta Business Suite with name: "order_confirmation"
 * Category: UTILITY
 * Body: "Hi {{1}}, your order *{{2}}* has been confirmed! 🎉\n\nTotal: KES {{3}}\n\nWe'll send you another message when it ships.\n\nThank you for shopping with Elite Style Co."
 */
export async function sendOrderConfirmationWA(
  to: string,
  customerName: string,
  orderRef: string,
  total: number
): Promise<WhatsAppResult> {
  const kes = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(total);

  return sendWhatsApp({
    to,
    type: "template",
    template: {
      name: "order_confirmation",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName || "there" },
            { type: "text", text: orderRef },
            { type: "text", text: kes },
          ],
        },
      ],
    },
  });
}

/**
 * Payment failed template.
 * Template name: "payment_failed"
 * Body: "Hi, your payment for order *{{1}}* was not completed. Please try again at {{2}} or reply to this message for help."
 */
export async function sendPaymentFailedWA(
  to: string,
  orderRef: string
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to,
    type: "template",
    template: {
      name: "payment_failed",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: orderRef },
            { type: "text", text: "e-commerce-website-web.vercel.app" },
          ],
        },
      ],
    },
  });
}

/**
 * Order shipped template.
 * Template name: "order_shipped"
 * Body: "Great news! 🚚 Your order *{{1}}* is on its way. Expected delivery: 1-3 business days. - Elite Style Co."
 */
export async function sendOrderShippedWA(
  to: string,
  orderRef: string
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to,
    type: "template",
    template: {
      name: "order_shipped",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: orderRef }],
        },
      ],
    },
  });
}

/**
 * Ready for pickup template.
 * Template name: "order_ready_pickup"
 * Body: "Hi! Your order *{{1}}* is ready for collection at our store. 🏪 Please bring this message as confirmation. See you soon!"
 */
export async function sendOrderReadyForPickupWA(
  to: string,
  orderRef: string
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to,
    type: "template",
    template: {
      name: "order_ready_pickup",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: orderRef }],
        },
      ],
    },
  });
}

/**
 * Free-form text message; works only within the 24-hour customer service window.
 * Use for sandbox testing or when responding to a customer who messaged first.
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to,
    type: "text",
    text: { body: text },
  });
}
