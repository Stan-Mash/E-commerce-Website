// Single typed entry point for e-commerce analytics events. Fans out to
// whichever of GA4 (gtag)/Meta Pixel (fbq)/TikTok Pixel (ttq) actually
// loaded (see components/analytics/AnalyticsScripts.tsx) — each call is a
// no-op for any script that isn't present, so this is always safe to call
// regardless of consent state or which env vars are configured.

const CURRENCY = "KES";

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void; page: () => void };
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag(...args);
}
function fbq(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq("track", event, params);
}
function ttq(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.ttq) window.ttq.track(event, params);
}

export function trackViewItemList(items: AnalyticsItem[], listName?: string): void {
  gtag("event", "view_item_list", { items, item_list_name: listName });
}

export function trackViewItem(item: AnalyticsItem): void {
  gtag("event", "view_item", { currency: CURRENCY, value: item.price, items: [item] });
  fbq("ViewContent", { content_ids: [item.item_id], content_type: "product", value: item.price, currency: CURRENCY });
  ttq("ViewContent", { content_id: item.item_id, value: item.price, currency: CURRENCY });
}

export function trackAddToCart(item: AnalyticsItem): void {
  const value = (item.price ?? 0) * (item.quantity ?? 1);
  gtag("event", "add_to_cart", { currency: CURRENCY, value, items: [item] });
  fbq("AddToCart", { content_ids: [item.item_id], content_type: "product", value, currency: CURRENCY });
  ttq("AddToCart", { content_id: item.item_id, value, currency: CURRENCY });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number): void {
  gtag("event", "begin_checkout", { currency: CURRENCY, value, items });
  fbq("InitiateCheckout", { value, currency: CURRENCY, num_items: items.length });
  ttq("InitiateCheckout", { value, currency: CURRENCY });
}

export function trackAddPaymentInfo(value: number, paymentMethod: string): void {
  gtag("event", "add_payment_info", { currency: CURRENCY, value, payment_type: paymentMethod });
  fbq("AddPaymentInfo", { value, currency: CURRENCY });
}

export function trackPurchase(orderRef: string, value: number, items: AnalyticsItem[]): void {
  gtag("event", "purchase", { transaction_id: orderRef, currency: CURRENCY, value, items });
  fbq("Purchase", { value, currency: CURRENCY, content_ids: items.map((i) => i.item_id) });
  ttq("CompletePayment", { value, currency: CURRENCY, content_id: orderRef });
}

export function trackSearch(searchTerm: string): void {
  gtag("event", "search", { search_term: searchTerm });
  ttq("Search", { query: searchTerm });
}

export function trackSignUp(method: string): void {
  gtag("event", "sign_up", { method });
  fbq("CompleteRegistration", { content_name: method });
}

export function trackTryOnGenerated(productId: string, durationMs: number, success: boolean): void {
  gtag("event", "try_on_generated", { product_id: productId, duration_ms: durationMs, success });
}
