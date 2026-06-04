import { supabase } from "../index";
import { sendWhatsApp, sendSMS } from "../notifications/africastalking";
import { maskPhone } from "./utils";

const QUERY_TIMEOUT_MS = 10_000;

export async function sendPaymentFailed({ orderId }: { orderId: string }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

  const { data: order, error } = await supabase
    .from("orders")
    .select("order_ref, total, phone")
    .eq("id", orderId)
    .abortSignal(controller.signal)
    .maybeSingle();

  clearTimeout(timer);

  if (error || !order) {
    throw new Error(`Order ${orderId} not found: ${error?.message ?? "no data"}`);
  }

  const supportPhone = process.env.SUPPORT_PHONE ?? "0700 000 000";

  const message = [
    `❌ *Payment not completed* for order *${order.order_ref}*.`,
    ``,
    `Your M-Pesa payment of KES ${Number(order.total).toLocaleString("en-KE")} did not go through.`,
    ``,
    `To retry, please visit our site or reply to this message. Your cart items have been released back to stock — place a new order when you're ready.`,
    ``,
    `Need help? Call or WhatsApp us at ${supportPhone}.`,
    ``,
    `Asante — Elite Style Co. 🛍️`,
  ].join("\n");

  let notified = false;

  try {
    await sendWhatsApp({ to: order.phone, message });
    console.log(`[notification] payment_failed WhatsApp sent to ${maskPhone(order.phone)} for order ${order.order_ref}`);
    notified = true;
  } catch (waErr) {
    console.warn(`[notification] payment_failed WhatsApp failed for ${order.order_ref}:`, (waErr as Error).message);
  }

  if (!notified) {
    const smsText = `Elite Style Co: Payment for order ${order.order_ref} did not complete. Visit our site to retry. Help: ${supportPhone}.`;
    await sendSMS({ to: order.phone, message: smsText });
    console.log(`[notification] payment_failed SMS sent to ${maskPhone(order.phone)} for order ${order.order_ref}`);
  }
}
