"use client";

import { useState, useEffect, useRef } from "react";
import { formatKES } from "@/lib/utils";
import type { ProductDetail, SKU } from "@nairobi-fashion/lib";

const WA_NUMBER =
  (process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+254 142 424 802").replace(/\D/g, "");
const SITE_URL = "https://elitestyle.co.ke";

function genRef(): string {
  const y = new Date().getFullYear();
  const r = Math.floor(1000 + Math.random() * 9000);
  return `ESC-${y}-${r}`;
}

function readCustomer(): { name: string; phone: string } {
  if (typeof window === "undefined") return { name: "", phone: "" };
  try {
    const s = localStorage.getItem("es_wa_customer");
    return s ? (JSON.parse(s) as { name: string; phone: string }) : { name: "", phone: "" };
  } catch {
    return { name: "", phone: "" };
  }
}

function saveCustomer(name: string, phone: string) {
  try { localStorage.setItem("es_wa_customer", JSON.stringify({ name, phone })); } catch { /* */ }
}

interface Props {
  product: ProductDetail;
  selectedSize: string | null;
  selectedSku?: SKU;
  inStock: boolean;
}

type Phase = "idle" | "open" | "sending" | "sent";

export function WhatsAppOrderCard({ product, selectedSize, selectedSku, inStock }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [refCode, setRefCode] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // Trigger CSS enter animation one frame after mount
  useEffect(() => {
    if (phase === "open") {
      const saved = readCustomer();
      setName(saved.name);
      setPhone(saved.phone);
      const t = setTimeout(() => {
        setReady(true);
        setTimeout(() => nameRef.current?.focus(), 380);
      }, 16);
      return () => clearTimeout(t);
    } else {
      setReady(false);
    }
  }, [phase]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const locked = phase !== "idle";
    if (locked) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  function handleOpen() { setPhase("open"); }
  function handleClose() {
    setReady(false);
    setTimeout(() => setPhase("idle"), 180);
  }

  async function handleSend() {
    const ref = genRef();
    setRefCode(ref);
    saveCustomer(name, phone);
    setPhase("sending");

    // Build the WhatsApp message
    const productUrl = `${SITE_URL}/products/${product.slug}?ref=${ref}`;
    const lines = [
      productUrl,
      "",
      `Order Reference: #${ref}`,
      "───────────────────────",
      `Product: ${product.name}`,
      selectedSize ? `Size: ${selectedSize}` : null,
      `Price: ${formatKES(product.base_price)}`,
      name ? `Customer: ${name}` : null,
      phone ? `Phone: ${phone}` : null,
      "───────────────────────",
      "Elite Style Co. · Shop 35, 4th Floor, Stanbank House, Moi Avenue, Nairobi CBD",
    ].filter((l): l is string => l !== null);

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

    // Log to DB (fire-and-forget — never block the WA redirect)
    fetch("/api/whatsapp-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref_code: ref,
        product_id: product.id,
        product_title: product.name,
        product_slug: product.slug,
        selected_size: selectedSize,
        unit_price_kes: product.base_price,
        customer_name: name || null,
        customer_phone: phone || null,
      }),
    }).catch(() => { /* silent */ });

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(12); } catch { /* */ }
    }

    window.open(waUrl, "_blank", "noopener,noreferrer");
    setPhase("sent");
  }

  // Stock hint for selected size
  const qty = selectedSku?.stock_quantity;
  const stockHint =
    qty !== undefined && qty > 0 && qty <= 3
      ? `Only ${qty} left in this size`
      : qty !== undefined && qty > 0
      ? "In stock · ready to ship"
      : null;

  // ── TRIGGER BUTTON ──────────────────────────────────────────────────────────
  const trigger = (
    <button
      onClick={handleOpen}
      className="w-full flex items-center justify-center gap-2.5 transition-colors"
      style={{
        background: "#0f0d08",
        color: "#c9a961",
        border: "1px solid rgba(201,169,97,.3)",
        fontFamily: "var(--font-inter, sans-serif)",
        fontSize: 10,
        letterSpacing: "0.4em",
        textTransform: "uppercase",
        fontWeight: 500,
        padding: "14px 0",
      }}
    >
      <WAIcon size={15} />
      Order via WhatsApp
    </button>
  );

  if (phase === "idle") return trigger;

  // ── MODAL ───────────────────────────────────────────────────────────────────
  return (
    <>
      {trigger}
      <div
        className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
        style={{
          background: ready ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0)",
          backdropFilter: ready ? "blur(3px)" : "none",
          transition: "background 0.22s, backdrop-filter 0.22s",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className="relative w-full sm:max-w-[420px] sm:mx-4 sm:rounded-none"
          style={{
            background: "#0a0908",
            border: "1px solid rgba(201,169,97,.18)",
            transform: ready ? "translateY(0)" : "translateY(28px)",
            opacity: ready ? 1 : 0,
            transition: "transform 0.26s cubic-bezier(0.32,0.72,0,1), opacity 0.22s",
            maxHeight: "92dvh",
            overflowY: "auto",
          }}
        >
          {/* Gold top edge accent */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #c9a961 30%, #c9a961 70%, transparent)", opacity: 0.7 }} />

          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#555",
              padding: 4,
              lineHeight: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>

          {phase === "sent" ? (
            <SentState refCode={refCode} onClose={handleClose} product={product} selectedSize={selectedSize} />
          ) : (
            <OrderForm
              ready={ready}
              product={product}
              selectedSize={selectedSize}
              stockHint={stockHint}
              name={name}
              phone={phone}
              setName={setName}
              setPhone={setPhone}
              nameRef={nameRef}
              sending={phase === "sending"}
              onSend={() => void handleSend()}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── ORDER FORM ─────────────────────────────────────────────────────────────────
interface FormProps {
  ready: boolean;
  product: ProductDetail;
  selectedSize: string | null;
  stockHint: string | null;
  name: string;
  phone: string;
  setName: (v: string) => void;
  setPhone: (v: string) => void;
  nameRef: React.RefObject<HTMLInputElement | null>;
  sending: boolean;
  onSend: () => void;
}

function OrderForm({
  ready, product, selectedSize, stockHint,
  name, phone, setName, setPhone, nameRef, sending, onSend,
}: FormProps) {
  const primaryImage = [...(product.product_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )[0];

  const reveal = (delay: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(7px)",
    transition: `opacity 0.26s ${delay}ms, transform 0.26s ${delay}ms`,
  });

  return (
    <div style={{ padding: "22px 24px 24px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5" style={reveal(80)}>
        <WAIcon size={14} />
        <span
          style={{
            color: "#c9a961",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 9,
            letterSpacing: "0.48em",
            textTransform: "uppercase",
          }}
        >
          Instant Order
        </span>
      </div>

      {/* Product snapshot */}
      <div
        className="flex gap-4 mb-5 pb-5"
        style={{
          borderBottom: "1px solid rgba(201,169,97,.12)",
          opacity: ready ? 1 : 0,
          transform: ready ? "translateX(0)" : "translateX(-10px)",
          transition: "opacity 0.3s 120ms, transform 0.3s 120ms",
        }}
      >
        <div
          style={{
            width: 72,
            height: 88,
            flexShrink: 0,
            background: "#1a1612",
            overflow: "hidden",
          }}
        >
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#2a1f10" }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: "#555",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 9,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Elite Style Co.
          </p>
          <p
            style={{
              fontFamily: "var(--font-bodoni, serif)",
              fontSize: 16,
              fontWeight: 600,
              color: "#f5f0eb",
              lineHeight: 1.25,
              marginBottom: 6,
            }}
          >
            {product.name}
          </p>
          {selectedSize && (
            <p style={{ color: "#888", fontSize: 11, fontFamily: "var(--font-inter, sans-serif)", marginBottom: 3 }}>
              Size: <span style={{ color: "#e8e0d0" }}>{selectedSize}</span>
            </p>
          )}
          {stockHint && (
            <p
              style={{
                color: "#c9a961",
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {stockHint}
            </p>
          )}
          <p
            style={{
              color: "#c9a961",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.06em",
              marginTop: 6,
            }}
          >
            {formatKES(product.base_price)}
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4 mb-5" style={reveal(185)}>
        <div>
          <label
            style={{
              display: "block",
              color: "#555",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 9,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Your Name
          </label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amina W."
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(201,169,97,.25)",
              outline: "none",
              color: "#f0ece6",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 13,
              paddingBottom: 8,
              caretColor: "#c9a961",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              color: "#555",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 9,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            WhatsApp / M-Pesa Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(201,169,97,.25)",
              outline: "none",
              color: "#f0ece6",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 13,
              paddingBottom: 8,
              caretColor: "#c9a961",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Send */}
      <div style={reveal(280)}>
        <button
          onClick={onSend}
          disabled={sending}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: sending ? "#1a1612" : "#25D366",
            color: sending ? "#c9a961" : "#fff",
            border: "none",
            cursor: sending ? "not-allowed" : "pointer",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 10,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            fontWeight: 500,
            padding: "14px 0",
            opacity: sending ? 0.65 : 1,
            transition: "background 0.2s, opacity 0.2s",
          }}
        >
          {sending ? (
            "Opening WhatsApp…"
          ) : (
            <>
              <WAIcon size={15} color="#fff" />
              Send Order
            </>
          )}
        </button>
        <p
          style={{
            textAlign: "center",
            marginTop: 10,
            color: "#3a3530",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 10,
            lineHeight: 1.5,
          }}
        >
          Opens WhatsApp with your order details pre-filled
        </p>
      </div>
    </div>
  );
}

// ── SENT STATE ─────────────────────────────────────────────────────────────────
interface SentProps {
  refCode: string;
  onClose: () => void;
  product: ProductDetail;
  selectedSize: string | null;
}

function SentState({ refCode, onClose, product, selectedSize }: SentProps) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div style={{ padding: "32px 24px 28px", textAlign: "center" }}>
      {/* Animated gold checkmark */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <svg width="54" height="54" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="24"
            fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="1.5" />
          <circle cx="27" cy="27" r="24"
            fill="none" stroke="#c9a961" strokeWidth="1.5"
            strokeDasharray="150.8"
            strokeDashoffset={drawn ? 0 : 150.8}
            style={{
              transition: "stroke-dashoffset 0.5s ease-out",
              transformOrigin: "50% 50%",
              transform: "rotate(-90deg)",
            }} />
          <polyline
            points="17,28 24,35 37,20"
            fill="none" stroke="#c9a961" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="32"
            strokeDashoffset={drawn ? 0 : 32}
            style={{ transition: "stroke-dashoffset 0.38s ease-out 0.38s" }} />
        </svg>
      </div>

      <p
        style={{
          color: "#555",
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 9,
          letterSpacing: "0.48em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Order Reference
      </p>
      <p
        style={{
          fontFamily: "var(--font-bodoni, serif)",
          fontSize: 22,
          fontWeight: 600,
          color: "#c9a961",
          letterSpacing: "0.04em",
          marginBottom: 5,
        }}
      >
        #{refCode}
      </p>
      <p style={{ color: "#777", fontFamily: "var(--font-inter, sans-serif)", fontSize: 13, marginBottom: 18 }}>
        {product.name}{selectedSize ? ` · ${selectedSize}` : ""}
      </p>
      <p
        style={{
          color: "#555",
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 11,
          lineHeight: 1.75,
          marginBottom: 22,
        }}
      >
        We typically reply within 1 hour<br />
        Mon – Sat · 9am – 6pm EAT
      </p>

      {/* M-Pesa escape hatch */}
      <div
        style={{
          background: "#111009",
          border: "1px solid rgba(201,169,97,.14)",
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <p
          style={{
            color: "#888",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 11,
            lineHeight: 1.65,
            marginBottom: 10,
          }}
        >
          Want to lock in this piece right now<br />without waiting?
        </p>
        <a
          href="/checkout"
          style={{
            display: "block",
            color: "#c9a961",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 500,
            border: "1px solid rgba(201,169,97,.3)",
            padding: "10px 0",
            textDecoration: "none",
          }}
        >
          Pay Instantly via M-Pesa →
        </a>
      </div>

      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#3a3530",
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 10,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        Close
      </button>
    </div>
  );
}

// ── WHATSAPP ICON ──────────────────────────────────────────────────────────────
function WAIcon({ size = 17, color = "#25D366" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
