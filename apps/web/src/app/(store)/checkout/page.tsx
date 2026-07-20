"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/checkout/CartProvider";
import { trackBeginCheckout, trackAddPaymentInfo } from "@/lib/analytics";

type DeliveryType = "pickup" | "cbd" | "outside_cbd";
type PayMethod = "mpesa" | "paybill" | "card" | "bnpl";

const OUTSIDE_CBD_FEE = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE_OUTSIDE_CBD ?? 300) || 300;
const PHONE_RE = /^(?:\+?254|0)7\d{8}$/;
const PAYBILL = process.env.NEXT_PUBLIC_MPESA_PAYBILL ?? "";
const PAYBILL_NAME = process.env.NEXT_PUBLIC_MPESA_PAYBILL_NAME ?? "Elite Style Co.";
const CARD_ENABLED = (process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "").startsWith("FLWPUBK");
const BNPL_NAME = process.env.NEXT_PUBLIC_BNPL_NAME ?? "";

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [delivery, setDelivery] = useState<DeliveryType>("cbd");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<PayMethod>("mpesa");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [apiError, setApiError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [promo, setPromo] = useState<{ discountAmount: number; deliveryFee: number; total: number; code: string | null; name: string } | null>(null);
  const [pickupPoints, setPickupPoints] = useState<{ id: string; name: string; area: string; address: string | null; fee: number }[]>([]);
  const [pickupPointId, setPickupPointId] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPoint = pickupPoints.find((p) => p.id === pickupPointId) ?? null;
  const baseDeliveryFee =
    delivery === "outside_cbd" ? OUTSIDE_CBD_FEE
    : delivery === "pickup" && selectedPoint ? selectedPoint.fee
    : 0;
  const deliveryFee = promo ? promo.deliveryFee : baseDeliveryFee;
  const discountAmount = promo?.discountAmount ?? 0;
  const total = promo ? promo.total : subtotal + baseDeliveryFee;
  const needsAddress = delivery === "cbd" || delivery === "outside_cbd";

  // Load pickup-point locations once (empty list = plain store pickup).
  useEffect(() => {
    fetch("/api/pickup-points")
      .then((r) => r.json())
      .then((d) => setPickupPoints(Array.isArray(d.points) ? d.points : []))
      .catch(() => setPickupPoints([]));
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(
        items.map((i) => ({ item_id: i.skuId, item_name: i.name, price: i.price, quantity: i.quantity })),
        subtotal
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A promotion's value can depend on the delivery method/fee, so any change
  // to delivery or pickup point invalidates a previously applied code.
  useEffect(() => {
    setPromo(null);
    setPromoMsg("");
  }, [delivery, pickupPointId]);

  async function applyPromo() {
    if (!promoCode.trim() || items.length === 0) return;
    setPromoChecking(true);
    setPromoMsg("");
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
          deliveryType: delivery,
          code: promoCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.appliedPromotion && data.discountAmount > 0) {
        setPromo({
          discountAmount: data.discountAmount,
          deliveryFee: data.deliveryFee,
          total: data.total,
          code: data.appliedPromotion.code,
          name: data.appliedPromotion.name,
        });
        setPromoMsg(`✓ ${data.appliedPromotion.name} applied`);
      } else {
        setPromo(null);
        setPromoMsg("That code isn't valid for this order.");
      }
    } catch {
      setPromoMsg("Couldn't check the code. Please try again.");
    } finally {
      setPromoChecking(false);
    }
  }

  function validate(): boolean {
    let ok = true;
    if (method !== "card" && !PHONE_RE.test(phone.replace(/\s/g, ""))) {
      setPhoneError("Enter a valid Safaricom number");
      ok = false;
    } else setPhoneError("");
    if (needsAddress && address.trim().length < 10) {
      setAddressError("Please enter a delivery address (min 10 characters)");
      ok = false;
    } else setAddressError("");
    return ok;
  }

  /** Poll the order-status endpoint until paid/failed or timeout. */
  function pollStatus(orderRef: string) {
    let elapsed = 0;
    const INTERVAL = 4000;
    const TIMEOUT = 120000; // 2 minutes
    setStatusMsg("Waiting for payment confirmation…");
    pollRef.current = setInterval(async () => {
      elapsed += INTERVAL;
      try {
        const res = await fetch(`/api/orders/status?ref=${encodeURIComponent(orderRef)}`);
        const data = await res.json();
        if (data.state === "paid") {
          clearInterval(pollRef.current!);
          clearCart();
          router.push(`/order-confirmed?ref=${encodeURIComponent(orderRef)}`);
          return;
        }
        if (data.state === "failed") {
          clearInterval(pollRef.current!);
          setWaiting(false);
          setApiError("Payment was not completed. Please try again.");
          return;
        }
      } catch {
        // keep polling
      }
      if (elapsed >= TIMEOUT) {
        clearInterval(pollRef.current!);
        setWaiting(false);
        setApiError(
          "We haven't received your payment yet. If you completed it, your order will still be confirmed — check 'Track Order'. Otherwise please try again."
        );
      }
    }, INTERVAL);
  }

  async function handlePay() {
    if (!validate()) return;
    // Guard: any item missing a valid SKU id means the product was added without
    // proper inventory set up. Show a clear message rather than letting the API
    // return a raw "Invalid uuid" Zod error.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (items.some((i) => !UUID_RE.test(i.skuId))) {
      setApiError("One or more items in your bag couldn't be loaded. Please remove them and try again.");
      return;
    }
    setApiError("");
    setSubmitting(true);
    trackAddPaymentInfo(total, method);
    const raw = phone.replace(/\s/g, "");
    const payload = {
      phone: raw || "0700000000",
      items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
      deliveryType: delivery,
      deliveryAddress: needsAddress ? address.trim() : undefined,
      promoCode: promo?.code ?? (promoCode.trim() || undefined),
      email: email.trim() || undefined,
      pickupPointId: delivery === "pickup" && pickupPointId ? pickupPointId : undefined,
    };

    try {
      if (method === "card") {
        const res = await fetch("/api/checkout/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.paymentLink) {
          setApiError(data.error ?? "Could not start card payment.");
          setSubmitting(false);
          return;
        }
        // Redirect to Flutterwave hosted checkout.
        window.location.href = data.paymentLink;
        return;
      }

      if (method === "bnpl") {
        const res = await fetch("/api/checkout/bnpl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.paymentLink) {
          setApiError(data.error ?? "Could not start the instalment payment.");
          setSubmitting(false);
          return;
        }
        window.location.href = data.paymentLink;
        return;
      }

      if (method === "paybill") {
        // Manual paybill: create the order (pending) then show instructions.
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, paymentMethod: "paybill" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setApiError(data.error ?? "Could not create order.");
          setSubmitting(false);
          return;
        }
        setSubmitting(false);
        setWaiting(true);
        setStatusMsg(
          `Pay ${formatKES(total)} to Paybill ${PAYBILL}, account ${data.orderRef}. We'll confirm automatically.`
        );
        pollStatus(data.orderRef);
        return;
      }

      // Default: M-Pesa STK push.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error ?? "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setWaiting(true);
      pollStatus(data.orderRef);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const DELIVERY_OPTS: { value: DeliveryType; label: string; detail: string; sub: string }[] = [
    { value: "pickup", label: "PICKUP", detail: "Stanbank House, CBD", sub: "Ready in 2hrs" },
    { value: "cbd", label: "NAIROBI CBD", detail: "Within the CBD", sub: "Nairobi CBD" },
    { value: "outside_cbd", label: "OUTSIDE CBD", detail: "Rest of Kenya", sub: `From ${formatKES(OUTSIDE_CBD_FEE)}` },
  ];

  const PAY_OPTS: { value: PayMethod; label: string; sub: string; show: boolean }[] = [
    { value: "mpesa", label: "M-PESA", sub: "STK push to your phone", show: true },
    { value: "paybill", label: "BUY GOODS", sub: PAYBILL ? `Till No. ${PAYBILL}` : "M-Pesa Till", show: !!PAYBILL },
    { value: "card", label: "CARD & MORE", sub: "Card, Airtel, bank", show: CARD_ENABLED },
    { value: "bnpl", label: "INSTALMENTS", sub: `Pay over time with ${BNPL_NAME}`, show: !!BNPL_NAME },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--es-paper)", fontFamily: "var(--font-inter)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48 }} className="checkout-grid">
          {/* Left: Form */}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 16 }}>
              Secure Checkout
            </p>
            <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 40, fontWeight: 400, lineHeight: 1.1, color: "var(--es-ink)", margin: "0 0 12px" }}>
              Checkout
            </h1>
            <p style={{ fontSize: 15, color: "var(--es-mute)", marginBottom: 40, maxWidth: 440 }}>
              Choose your delivery option and payment method below.
            </p>

            {/* Delivery */}
            <div style={{ marginBottom: 36 }}>
              <p style={LABEL}>Delivery Option</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="opt-grid">
                {DELIVERY_OPTS.map((opt) => {
                  const sel = delivery === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setDelivery(opt.value)} disabled={waiting}
                      style={optStyle(sel)} aria-pressed={sel}>
                      <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: sel ? "var(--es-ink)" : "var(--es-ink)", fontWeight: 600, marginBottom: 6 }}>{opt.label}</p>
                      <p style={{ fontSize: 13, color: "var(--es-ink)", marginBottom: 2 }}>{opt.detail}</p>
                      <p style={{ fontSize: 12, color: "var(--es-mute)" }}>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pickup point (Pickup Mtaani-style agents) */}
            {delivery === "pickup" && pickupPoints.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <p style={LABEL}>Collection Point</p>
                <select
                  value={pickupPointId}
                  onChange={(e) => setPickupPointId(e.target.value)}
                  disabled={waiting}
                  style={{ width: "100%", fontSize: 15, fontFamily: "var(--font-inter)", padding: "12px", border: "1px solid var(--es-bone)", background: "var(--es-white)", color: "var(--es-ink)", outline: "none" }}
                >
                  <option value="">Store pickup — Stanbank House, Moi Avenue (free)</option>
                  {pickupPoints.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.area} — {p.name}{p.fee > 0 ? ` (+${formatKES(p.fee)})` : " (free)"}
                    </option>
                  ))}
                </select>
                {selectedPoint?.address && (
                  <p style={{ fontSize: 12, color: "var(--es-mute)", marginTop: 6 }}>{selectedPoint.address}</p>
                )}
              </div>
            )}

            {/* Address */}
            {needsAddress && (
              <div style={{ marginBottom: 36 }}>
                <p style={LABEL}>Delivery Address</p>
                <textarea value={address} onChange={(e) => { setAddress(e.target.value); if (addressError) setAddressError(""); }}
                  placeholder="Building, street, area, and any landmark…" rows={3} disabled={waiting}
                  style={{ width: "100%", fontSize: 15, fontFamily: "var(--font-inter)", padding: "12px", border: addressError ? "1px solid #c0392b" : "1px solid var(--es-bone)", background: "var(--es-white)", color: "var(--es-ink)", outline: "none", resize: "vertical" }} />
                {addressError && <p style={ERR}>{addressError}</p>}
              </div>
            )}

            {/* Payment method */}
            <div style={{ marginBottom: 36 }}>
              <p style={LABEL}>Payment Method</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="opt-grid">
                {PAY_OPTS.filter((o) => o.show).map((opt) => {
                  const sel = method === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setMethod(opt.value)} disabled={waiting}
                      style={optStyle(sel)} aria-pressed={sel}>
                      <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: sel ? "var(--es-ink)" : "var(--es-ink)", fontWeight: 700, marginBottom: 4 }}>{opt.label}</p>
                      <p style={{ fontSize: 12, color: "var(--es-mute)" }}>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone (not needed for card; FW collects it) */}
            {method !== "card" && (
              <div style={{ marginBottom: 36 }}>
                <p style={LABEL}>Safaricom Number</p>
                <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                  placeholder="+254 7XX XXX XXX" disabled={waiting}
                  style={{ display: "block", width: "100%", fontSize: 18, fontFamily: "var(--font-inter)", padding: "14px 0", border: "none", borderBottom: phoneError ? "1px solid #c0392b" : "1px solid var(--es-ink)", background: "transparent", color: "var(--es-ink)", outline: "none" }} />
                {phoneError && <p style={ERR}>{phoneError}</p>}
              </div>
            )}

            {/* Email (optional — for an emailed receipt) */}
            <div style={{ marginBottom: 36 }}>
              <p style={LABEL}>Email <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--es-faint)" }}>(optional, for a receipt)</span></p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={waiting}
                style={{ display: "block", width: "100%", fontSize: 18, fontFamily: "var(--font-inter)", padding: "14px 0", border: "none", borderBottom: "1px solid var(--es-ink)", background: "transparent", color: "var(--es-ink)", outline: "none" }}
              />
            </div>

            {apiError && <div role="alert" style={{ fontSize: 13, color: "#c0392b", background: "#fdf2f2", border: "1px solid #f5c6c6", padding: "12px 16px", marginBottom: 24 }}>{apiError}</div>}

            {waiting ? (
              <WaitingState message={statusMsg} />
            ) : (
              <button type="button" className="es-btn-plum" style={{ width: "100%" }} onClick={handlePay} disabled={submitting || items.length === 0}>
                {submitting ? "Processing…" : `PAY ${formatKES(total)} →`}
              </button>
            )}
          </div>

          {/* Right: Summary */}
          <aside>
            <div style={{ background: "var(--es-white)", padding: "32px 28px", position: "sticky", top: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--es-ink)", marginBottom: 24 }}>Order Summary</p>
              {items.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--es-mute)" }}>Your cart is empty.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                  {items.map((item) => (
                    <li key={item.skuId} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, paddingBottom: 14, borderBottom: "1px solid var(--es-bone)", marginBottom: 14 }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 15, color: "var(--es-ink)" }}>{item.name}</p>
                        {(item.size || item.color) && (
                          <p style={{ fontSize: 11, color: "var(--es-mute)", marginTop: 2, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            {[item.size && `Size: ${item.size}`, item.color && item.color, item.quantity > 1 && `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 14, color: "var(--es-ink)", whiteSpace: "nowrap" }}>{formatKES(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Row label="Subtotal" value={formatKES(subtotal)} />
              <Row label={delivery === "outside_cbd" ? "Delivery (outside CBD)" : "Delivery"} value={deliveryFee === 0 ? "FREE" : formatKES(deliveryFee)} />
              {discountAmount > 0 && (
                <Row label={`Discount${promo?.code ? ` (${promo.code})` : ""}`} value={`− ${formatKES(discountAmount)}`} />
              )}

              {/* Promo code */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE"
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--es-bone)", background: "var(--es-white)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}
                />
                <button
                  type="button"
                  onClick={() => void applyPromo()}
                  disabled={promoChecking || !promoCode.trim()}
                  className="es-btn-outline-ink"
                  style={{ padding: "0 16px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: promoChecking || !promoCode.trim() ? "not-allowed" : "pointer", opacity: promoChecking || !promoCode.trim() ? 0.6 : 1 }}
                >
                  {promoChecking ? "…" : "Apply"}
                </button>
              </div>
              {promoMsg && (
                <p style={{ fontSize: 12, marginTop: 6, color: promo ? "#2e7d32" : "#c0392b" }}>{promoMsg}</p>
              )}

              <div style={{ height: 1, background: "var(--es-bone)", margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
                <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total</span>
                <span style={{ fontFamily: "var(--font-bodoni)", fontSize: 24, color: "var(--es-ink)" }}>{formatKES(total)}</span>
              </div>
              <MpesaBadge />
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .checkout-grid { grid-template-columns: 2fr 1fr !important; } }
        @media (max-width: 560px) { .opt-grid { grid-template-columns: 1fr !important; } }
        input::placeholder, textarea::placeholder { color: var(--es-faint); }
        input:focus { border-bottom-color: var(--es-ink) !important; }
      `}</style>
    </div>
  );
}

const LABEL: React.CSSProperties = { fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--es-mute)", marginBottom: 14 };
const ERR: React.CSSProperties = { fontSize: 12, color: "#c0392b", marginTop: 6 };
function optStyle(sel: boolean): React.CSSProperties {
  return { padding: "16px 14px", border: sel ? "1.5px solid var(--es-ink)" : "1.5px solid var(--es-bone)", background: sel ? "var(--es-white)" : "var(--es-paper)", cursor: "pointer", textAlign: "left", transition: "border-color .15s, background .15s" };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: "var(--es-mute)" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--es-ink)" }}>{value}</span>
    </div>
  );
}

function WaitingState({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", background: "var(--es-white)", border: "1px solid var(--es-bone)", textAlign: "center" }}>
      <span aria-hidden="true" style={{ display: "inline-block", width: 36, height: 36, border: "3px solid var(--es-bone)", borderTopColor: "var(--es-ink)", borderRadius: "50%", animation: "es-spin 0.75s linear infinite" }} />
      <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 20, color: "var(--es-ink)", marginTop: 20, marginBottom: 8 }}>
        {message || "Waiting for M-Pesa confirmation…"}
      </p>
      <p style={{ fontSize: 14, color: "var(--es-mute)" }}>Check your phone and enter your M-Pesa PIN. This page updates automatically.</p>
      <style>{`@keyframes es-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MpesaBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#007a39", color: "#fff", padding: "8px 14px", borderRadius: 4 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="white" opacity="0.2" />
        <path d="M7 12.5L10.5 16L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.1em" }}>M-PESA · CARD · PAYBILL</span>
    </div>
  );
}
