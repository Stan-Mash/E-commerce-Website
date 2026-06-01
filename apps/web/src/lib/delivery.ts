/**
 * Delivery pricing rules.
 *
 * Policy: delivery is FREE within Nairobi CBD. Anywhere else in Kenya is a
 * flat fee (configurable via DELIVERY_FEE_OUTSIDE_CBD; defaults to KES 300).
 * In-store pickup is always free.
 *
 * `deliveryType` values:
 *   - "pickup"      → collect in store (free)
 *   - "cbd"         → delivery inside Nairobi CBD (free)
 *   - "outside_cbd" → delivery elsewhere in Kenya (flat fee)
 *
 * NOTE: the legacy value "door" is treated as "outside_cbd" for backwards
 * compatibility with any orders/links created before this change.
 */
export type DeliveryType = "pickup" | "cbd" | "outside_cbd";

/** Flat fee (KES) for deliveries outside Nairobi CBD. */
export const OUTSIDE_CBD_FEE: number = (() => {
  const raw = Number(process.env.DELIVERY_FEE_OUTSIDE_CBD ?? process.env.NEXT_PUBLIC_DELIVERY_FEE_OUTSIDE_CBD);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 300;
})();

/** Normalise any incoming delivery value (incl. legacy "door") to a canonical type. */
export function normaliseDeliveryType(value: string | null | undefined): DeliveryType {
  switch (value) {
    case "pickup":
      return "pickup";
    case "cbd":
      return "cbd";
    case "outside_cbd":
    case "door": // legacy
      return "outside_cbd";
    default:
      return "pickup";
  }
}

/** Delivery fee in KES (always a whole number) for a given delivery type. */
export function deliveryFeeFor(type: DeliveryType): number {
  return type === "outside_cbd" ? OUTSIDE_CBD_FEE : 0;
}

/** Whether this delivery type requires a shipping address. */
export function requiresAddress(type: DeliveryType): boolean {
  return type === "cbd" || type === "outside_cbd";
}
