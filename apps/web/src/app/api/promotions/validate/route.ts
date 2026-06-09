import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { deliveryFeeFor, normaliseDeliveryType } from "@/lib/delivery";
import { applyDiscounts, type Promotion } from "@/lib/promotions/engine";

// POST /api/promotions/validate — read-only price quote with a promo code.
// Lets the checkout page show the live discount before an order is created.
const Schema = z.object({
  items: z
    .array(z.object({ skuId: z.string().uuid(), quantity: z.number().int().positive().max(10) }))
    .min(1)
    .max(20),
  deliveryType: z.enum(["pickup", "cbd", "outside_cbd", "door"]),
  code: z.string().max(40).optional(),
});

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const { items, code } = parsed.data;
  const deliveryType = normaliseDeliveryType(parsed.data.deliveryType);
  const supabase = createAdminSupabaseClient();

  const skuIds = items.map((i) => i.skuId);
  const { data: rawSkus, error } = await supabase
    .from("skus")
    .select("id, product:products(base_price)")
    .in("id", skuIds);
  if (error || !rawSkus || rawSkus.length !== items.length) {
    return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
  }
  const skus = rawSkus as unknown as Array<{ id: string; product: { base_price: number } | null }>;

  const lineItems = items.map((item) => {
    const sku = skus.find((s) => s.id === item.skuId);
    const price = sku?.product?.base_price ?? 0;
    return { sku_id: item.skuId, quantity: item.quantity, unit_price: Math.round(price) };
  });

  const { data: promoRows } = await supabase.from("promotions").select("*").eq("active", true);
  const promotions = (promoRows ?? []) as Promotion[];

  const result = applyDiscounts(lineItems, deliveryFeeFor(deliveryType), promotions, code);

  const codeWasEntered = !!code && code.trim().length > 0;
  const codeMatched = !!result.appliedPromotion && result.appliedPromotion.code !== null;

  return NextResponse.json({
    subtotal: result.subtotal,
    deliveryFee: result.deliveryFee,
    discountAmount: result.discountAmount,
    total: result.total,
    appliedPromotion: result.appliedPromotion
      ? { code: result.appliedPromotion.code, name: result.appliedPromotion.name }
      : null,
    codeValid: codeWasEntered ? codeMatched : null,
  });
}
