import { supabase } from "../index";
import { sendWhatsApp, sendSMS } from "../notifications/africastalking";
import { maskPhone } from "./utils";

export async function sendOrderConfirmation({ orderId }: { orderId: string }) {
  // Fetch order with items
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `order_ref, total, delivery_type, phone, status,
       order_items(quantity, unit_price, sku:skus(size, color, product:products(name)))`
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order ${orderId} not found: ${error?.message}`);
  }

  const itemLines = (order.order_items as any[])
    .map((i: any) => `• ${i.sku?.product?.name} (${i.sku?.size ?? ""}${i.sku?.color ? ` / ${i.sku.color}` : ""}) x${i.quantity}`)
    .join("\n");

  const deliveryLine =
    order.delivery_type === "pickup"
      ? "📍 Pickup: Westgate Mall, Westlands — ready in 2hrs after payment confirmation"
      : "🚚 Door delivery: 1–2 business days";

  const message = [
    `✅ *Order Confirmed!* 🎉`,
    ``,
    `Hi there! Your Nairobi Fashion order *${order.order_ref}* has been received.`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `*Total:* KES ${Number(order.total).toLocaleString("en-KE")}`,
    ``,
    deliveryLine,
    ``,
    `Questions? Reply to this message or call us at 0700 000 000.`,
    ``,
    `Asante sana! 🇰🇪`,
  ].join("\n");

  let notified = false;

  // Try WhatsApp first
  try {
    await sendWhatsApp({ to: order.phone, message });
    console.log(`[notification] WhatsApp sent to ${maskPhone(order.phone)} for order ${order.order_ref}`);
    notified = true;
  } catch (waErr) {
    console.warn(`[notification] WhatsApp failed for ${order.order_ref}:`, (waErr as Error).message);
  }

  // SMS fallback
  if (!notified) {
    const smsText = `Nairobi Fashion: Order ${order.order_ref} confirmed! Total KES ${Number(order.total).toLocaleString("en-KE")}. ${order.delivery_type === "pickup" ? "Pickup: Westgate, Westlands." : "Delivery in 1-2 days."} Asante!`;
    await sendSMS({ to: order.phone, message: smsText });
    console.log(`[notification] SMS sent to ${maskPhone(order.phone)} for order ${order.order_ref}`);
  }
}
