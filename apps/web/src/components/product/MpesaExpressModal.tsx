"use client";

import { useState, useEffect, useRef } from "react";
import type { ProductDetail } from "@nairobi-fashion/lib";
import { formatKES } from "@/lib/utils";

const PHONE_RE = /^(?:\+?254|0)7\d{8}$/;
const MPESA_STK_ENABLED = process.env.NEXT_PUBLIC_MPESA_STK_ENABLED === "true";
const PAYBILL = process.env.NEXT_PUBLIC_MPESA_PAYBILL ?? "";

interface Props {
  product: ProductDetail;
  selectedSize: string | null;
  onClose: () => void;
}

type Step = "form" | "processing" | "done" | "error";

export function MpesaExpressModal({ product, selectedSize, onClose }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<"pickup" | "cbd" | "estate">("cbd");
  const [phoneErr, setPhoneErr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
      phoneRef.current?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Prefill phone from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("es_wa_customer");
      if (saved) {
        const { phone: p } = JSON.parse(saved) as { name?: string; phone?: string };
        if (p) setPhone(p);
      }
    } catch { /* */ }
  }, []);

  async function handlePay() {
    setPhoneErr("");
    const cleaned = phone.trim().replace(/\s/g, "");
    if (!PHONE_RE.test(cleaned)) {
      setPhoneErr("Enter a valid Safaricom number (07xx or +2547xx)");
      return;
    }

    // Save phone for future visits
    try {
      const saved = JSON.parse(localStorage.getItem("es_wa_customer") ?? "{}") as Record<string, string>;
      localStorage.setItem("es_wa_customer", JSON.stringify({ ...saved, phone: cleaned }));
    } catch { /* */ }

    setStep("processing");

    if (MPESA_STK_ENABLED) {
      try {
        const res = await fetch("/api/checkout/mpesa-stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleaned,
            items: [{ skuId: product.skus?.[0]?.id ?? "", name: product.name, price: product.base_price, quantity: 1, size: selectedSize ?? "" }],
            deliveryType: delivery === "estate" ? "outside_cbd" : delivery,
            total: product.base_price,
          }),
        });
        if (res.ok) {
          setStep("done");
        } else {
          const d = await res.json() as { error?: string };
          setErrorMsg(d.error ?? "STK push failed. Please try again.");
          setStep("error");
        }
      } catch {
        setErrorMsg("Network error. Please try again.");
        setStep("error");
      }
    } else if (PAYBILL) {
      // Fall back to showing manual Paybill instructions
      setStep("done");
    } else {
      setErrorMsg("Online payment is not configured yet. Please order via WhatsApp.");
      setStep("error");
    }
  }

  const reveal = {
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.24s, transform 0.24s cubic-bezier(0.32,0.72,0,1)",
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      style={{
        background: ready ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
        transition: "background 0.2s",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-[400px] sm:mx-4 bg-white"
        style={{ ...reveal, maxHeight: "92dvh", overflowY: "auto" }}
      >
        {/* Green header strip */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #1abc9c, #16a085)" }} />

        <div style={{ padding: "24px 24px 28px" }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 18, lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>

          {step === "form" && (
            <>
              <p style={{ fontSize: 9, letterSpacing: "0.42em", textTransform: "uppercase", color: "#1abc9c", marginBottom: 6, fontFamily: "var(--font-inter,sans-serif)" }}>M-Pesa Express</p>
              <h2 style={{ fontFamily: "var(--font-bodoni,serif)", fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 4, lineHeight: 1.2 }}>
                Buy Now
              </h2>
              <p style={{ fontSize: 12, color: "#777", marginBottom: 20, fontFamily: "var(--font-inter,sans-serif)" }}>
                {product.name}{selectedSize ? ` · ${selectedSize}` : ""} — <strong style={{ color: "#111" }}>{formatKES(product.base_price)}</strong>
              </p>

              {/* Phone */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#888", marginBottom: 8, fontFamily: "var(--font-inter,sans-serif)" }}>
                  Safaricom Number
                </label>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: phoneErr ? "1px solid #e74c3c" : "1px solid #e0dbd4",
                    padding: "10px 12px", fontSize: 14, outline: "none",
                    fontFamily: "var(--font-inter,sans-serif)", color: "#111",
                    background: "transparent",
                  }}
                />
                {phoneErr && <p style={{ fontSize: 11, color: "#e74c3c", marginTop: 5, fontFamily: "var(--font-inter,sans-serif)" }}>{phoneErr}</p>}
              </div>

              {/* Delivery */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#888", marginBottom: 10, fontFamily: "var(--font-inter,sans-serif)" }}>
                  Delivery
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { val: "cbd"     as const, label: "Nairobi CBD",    sub: "Free · same day", fee: 0 },
                    { val: "pickup"  as const, label: "In-Store Pickup", sub: "Free · Stanbank House", fee: 0 },
                    { val: "estate"  as const, label: "Nairobi Estates", sub: "KES 300 · rider dispatch", fee: 300 },
                  ].map(({ val, label, sub }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDelivery(val)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px",
                        border: delivery === val ? "1px solid #111" : "1px solid #e0dbd4",
                        background: delivery === val ? "#111" : "transparent",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid", borderColor: delivery === val ? "#fff" : "#bbb", flexShrink: 0, background: delivery === val ? "#1abc9c" : "transparent" }} />
                      <span>
                        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: delivery === val ? "#fff" : "#111", fontFamily: "var(--font-inter,sans-serif)" }}>{label}</span>
                        <span style={{ display: "block", fontSize: 11, color: delivery === val ? "#ccc" : "#999", fontFamily: "var(--font-inter,sans-serif)" }}>{sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => void handlePay()}
                style={{
                  width: "100%", background: "#1abc9c", color: "#fff",
                  border: "none", padding: "14px 0", cursor: "pointer",
                  fontSize: 10, letterSpacing: "0.38em", textTransform: "uppercase",
                  fontFamily: "var(--font-inter,sans-serif)", fontWeight: 600,
                }}
              >
                Pay {formatKES(product.base_price + (delivery === "estate" ? 300 : 0))} via M-Pesa →
              </button>
            </>
          )}

          {step === "processing" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{ marginBottom: 16 }}>
                {/* Spinner */}
                <div style={{ width: 36, height: 36, border: "3px solid #e8e0d4", borderTopColor: "#1abc9c", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
              </div>
              <p style={{ fontSize: 14, color: "#111", fontFamily: "var(--font-bodoni,serif)", marginBottom: 8 }}>Check your phone</p>
              <p style={{ fontSize: 12, color: "#777", fontFamily: "var(--font-inter,sans-serif)", lineHeight: 1.6 }}>
                An M-Pesa STK push has been sent to {phone}.<br />Enter your PIN to complete.
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {step === "done" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12, color: "#1abc9c" }}>✓</div>
              <p style={{ fontFamily: "var(--font-bodoni,serif)", fontSize: 18, color: "#111", marginBottom: 8 }}>Payment Initiated</p>
              <p style={{ fontSize: 12, color: "#777", fontFamily: "var(--font-inter,sans-serif)", lineHeight: 1.65, marginBottom: 20 }}>
                {MPESA_STK_ENABLED
                  ? "Complete the M-Pesa prompt on your phone. You will receive an SMS confirmation."
                  : `Send KES ${formatKES(product.base_price)} to Paybill ${PAYBILL} — Account: ${product.name.slice(0, 12)}`}
              </p>
              <button onClick={onClose} style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", background: "none", border: "none", color: "#999", cursor: "pointer", fontFamily: "var(--font-inter,sans-serif)" }}>
                Close
              </button>
            </div>
          )}

          {step === "error" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-bodoni,serif)", fontSize: 18, color: "#c0392b", marginBottom: 8 }}>Payment Failed</p>
              <p style={{ fontSize: 12, color: "#777", fontFamily: "var(--font-inter,sans-serif)", marginBottom: 20 }}>{errorMsg}</p>
              <button onClick={() => setStep("form")} style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", background: "none", border: "1px solid #ccc", padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-inter,sans-serif)" }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
