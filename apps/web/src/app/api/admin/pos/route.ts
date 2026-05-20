import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function checkAuth(request: NextRequest): boolean {
  const session = request.cookies.get("admin_session");
  return session?.value === "elite-admin-2024";
}

function generateOrderRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `POS-${ts}-${rand}`;
}

interface CartItem {
  sku_id: string;
  quantity: number;
  unit_price: number;
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const {
    phone,
    payment_method,
    items,
  }: {
    phone: string;
    payment_method: "mpesa" | "cash";
    items: CartItem[];
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items in order" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Upsert customer
  let customer_id: string | null = null;
  if (phone) {
    const { data: customer } = await supabase
      .from("customers")
      .upsert({ phone }, { onConflict: "phone" })
      .select("id")
      .single();
    customer_id = customer?.id ?? null;
  }

  // Verify stock & compute totals
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const total = subtotal; // No delivery fee for pickup

  const order_ref = generateOrderRef();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_ref,
      customer_id,
      status: "paid",
      subtotal,
      delivery_fee: 0,
      total,
      delivery_type: "pickup",
      phone: phone || "N/A",
      notes: `POS sale — payment: ${payment_method}`,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Insert order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    sku_id: item.sku_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.unit_price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Deduct stock via inventory_log and update skus
  for (const item of items) {
    // Log inventory change
    await supabase.from("inventory_log").insert({
      sku_id: item.sku_id,
      delta: -item.quantity,
      reason: "sale",
      reference: order.id,
    });

    // Fetch current stock and decrement
    const { data: skuData } = await supabase
      .from("skus")
      .select("stock_quantity")
      .eq("id", item.sku_id)
      .single();

    if (skuData) {
      const newQty = Math.max(0, skuData.stock_quantity - item.quantity);
      await supabase
        .from("skus")
        .update({ stock_quantity: newQty })
        .eq("id", item.sku_id);
    }
  }

  return NextResponse.json({ order, order_ref: order.order_ref }, { status: 201 });
}
