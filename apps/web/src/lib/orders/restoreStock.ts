import type { SupabaseClient } from "@supabase/supabase-js";

// Restores the stock reserved by an order that ended up not being paid for
// (underpaid Buy Goods, or a staff-rejected pending payment), and logs each
// restoration for the audit trail. Extracted from the C2B webhook's underpaid
// branch so the admin "reject" action can share the exact same behavior.
export async function restoreOrderStock(supabase: SupabaseClient, orderId: string): Promise<void> {
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("sku_id, quantity")
    .eq("order_id", orderId);

  const { data: orderData } = await supabase
    .from("orders")
    .select("location_id")
    .eq("id", orderId)
    .single();

  if (!orderItems) return;

  for (const item of orderItems) {
    // POS orders restore to their location; web orders (no location_id)
    // restore via the default-warehouse RPC so the stock isn't lost.
    if (orderData?.location_id) {
      await supabase.rpc("increment_location_stock", {
        p_sku_id: item.sku_id,
        p_location_id: orderData.location_id,
        p_delta: item.quantity,
      });
    } else {
      await supabase.rpc("increment_sku_stock", {
        p_sku_id: item.sku_id,
        p_delta: item.quantity,
      });
    }
    await supabase.from("inventory_log").insert({
      sku_id: item.sku_id,
      delta: item.quantity,
      reason: "payment_failed",
      reference: orderId,
    });
  }
}
