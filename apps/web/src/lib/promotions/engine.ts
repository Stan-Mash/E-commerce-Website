/**
 * Promotions engine — shared between the online checkout API and the POS.
 *
 * applyDiscounts() is a pure function: it takes a cart + available promotions
 * and returns the final totals. No database calls happen here — the caller
 * is responsible for fetching active promotions and for calling
 * redeem_promotion() in Postgres once the order is confirmed.
 *
 * Priority rule: only ONE promotion is applied per order (the one that gives
 * the largest discount). This avoids stacking abuse.
 */

export interface Promotion {
  id: string;
  name: string;
  code: string | null;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  min_spend: number | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
}

export interface CartLineItem {
  sku_id: string;
  quantity: number;
  unit_price: number;
}

export interface DiscountResult {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  appliedPromotion: Promotion | null;
}

/**
 * Apply the best valid promotion to a cart.
 *
 * @param items       Cart line items (unit_price already Math.round()-ed)
 * @param deliveryFee Delivery fee in KES (0 for pickup / POS)
 * @param promotions  Active promotions fetched from DB (pre-filtered by active=true)
 * @param promoCode   Optional promo code entered by the customer
 */
export function applyDiscounts(
  items: CartLineItem[],
  deliveryFee: number,
  promotions: Promotion[],
  promoCode?: string
): DiscountResult {
  const subtotal = Math.round(
    items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  );

  const now = new Date();
  let bestPromotion: Promotion | null = null;
  let bestDiscount = 0;

  for (const promo of promotions) {
    if (!promo.active) continue;
    if (promo.starts_at  && new Date(promo.starts_at)  > now) continue;
    if (promo.expires_at && new Date(promo.expires_at) <= now) continue;
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) continue;
    if (promo.min_spend !== null && subtotal < promo.min_spend) continue;

    // Code-based promotions only fire if the code matches
    if (promo.code !== null && promo.code.toUpperCase() !== (promoCode ?? "").toUpperCase()) {
      continue;
    }

    let discount = 0;
    switch (promo.type) {
      case "percentage":
        discount = Math.round(subtotal * (promo.value / 100));
        break;
      case "fixed_amount":
        discount = Math.min(Math.round(promo.value), subtotal);
        break;
      case "free_shipping":
        discount = deliveryFee;
        break;
    }

    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestPromotion = promo;
    }
  }

  const discountAmount = bestDiscount;
  const finalDelivery  = bestPromotion?.type === "free_shipping" ? 0 : deliveryFee;
  const total          = Math.max(0, subtotal + finalDelivery - discountAmount);

  return {
    subtotal,
    discountAmount,
    deliveryFee: finalDelivery,
    total,
    appliedPromotion: bestPromotion,
  };
}
