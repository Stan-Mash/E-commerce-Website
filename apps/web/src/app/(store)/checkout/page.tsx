"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/checkout/CartProvider";
import { generateOrderRef } from "@/lib/utils";

type DeliveryType = "pickup" | "door";

const DELIVERY_FEE = 250;
const PHONE_RE = /^(?:254|0)7\d{8}$/;

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
  const [delivery, setDelivery] = useState<DeliveryType>("pickup");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [apiError, setApiError] = useState("");

  const deliveryFee = delivery === "door" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  function validatePhone(value: string) {
    const raw = value.replace(/\s/g, "");
    return PHONE_RE.test(raw);
  }

  async function handlePay() {
    const raw = phone.replace(/\s/g, "");
    if (!validatePhone(raw)) {
      setPhoneError("Enter a valid Safaricom number");
      return;
    }
    setPhoneError("");
    setApiError("");
    setSubmitting(true);

    const orderRef = generateOrderRef();

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: raw,
          items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
          deliveryType: delivery,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setWaiting(true);
      setSubmitting(false);

      // Give the user time to complete M-Pesa PIN, then redirect
      setTimeout(() => {
        clearCart();
        router.push(`/order-confirmed?ref=${data.orderRef ?? orderRef}`);
      }, 8000);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--es-paper)",
        fontFamily: "var(--font-inter)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "56px 24px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 48,
          }}
          className="checkout-grid"
        >
          {/* ── Left Column: Form ── */}
          <div style={{ minWidth: 0 }}>
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: "var(--es-gold)",
                marginBottom: 16,
              }}
            >
              Secure Checkout
            </p>

            {/* Heading */}
            <h1
              style={{
                fontFamily: "var(--font-bodoni)",
                fontSize: 40,
                fontWeight: 400,
                lineHeight: 1.1,
                color: "var(--es-ink)",
                margin: "0 0 12px",
              }}
            >
              Pay with M-Pesa
            </h1>

            {/* Subtext */}
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                color: "var(--es-mute)",
                marginBottom: 40,
                maxWidth: 440,
              }}
            >
              Enter your Safaricom number. We&apos;ll send a push notification to confirm.
            </p>

            {/* Phone Input */}
            <div style={{ marginBottom: 40 }}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                placeholder="+254 7XX XXX XXX"
                style={{
                  display: "block",
                  width: "100%",
                  fontSize: 18,
                  fontFamily: "var(--font-inter)",
                  padding: "16px 0",
                  border: "none",
                  borderBottom: phoneError
                    ? "1px solid #c0392b"
                    : "1px solid var(--es-ink)",
                  background: "transparent",
                  color: "var(--es-ink)",
                  outline: "none",
                }}
                aria-label="Safaricom phone number"
                aria-describedby={phoneError ? "phone-error" : undefined}
                disabled={waiting}
              />
              {phoneError && (
                <p
                  id="phone-error"
                  role="alert"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    color: "#c0392b",
                    marginTop: 6,
                  }}
                >
                  {phoneError}
                </p>
              )}
            </div>

            {/* Delivery Type */}
            <div style={{ marginBottom: 40 }}>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--es-mute)",
                  marginBottom: 14,
                }}
              >
                Delivery Option
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {(
                  [
                    {
                      value: "pickup" as const,
                      label: "PICKUP",
                      detail: "Westlands Flagship",
                      sub: "Free · Ready in 2hrs",
                    },
                    {
                      value: "door" as const,
                      label: "DOOR DELIVERY",
                      detail: "Nairobi from KES 250",
                      sub: "1–2 days",
                    },
                  ] as const
                ).map((opt) => {
                  const selected = delivery === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDelivery(opt.value)}
                      disabled={waiting}
                      style={{
                        padding: "18px 16px",
                        border: selected
                          ? "1.5px solid var(--es-plum)"
                          : "1.5px solid var(--es-bone)",
                        background: selected
                          ? "var(--es-white)"
                          : "var(--es-paper)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "border-color 0.15s, background 0.15s",
                        minHeight: "unset",
                        minWidth: "unset",
                      }}
                      aria-pressed={selected}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          letterSpacing: "0.3em",
                          textTransform: "uppercase",
                          color: selected
                            ? "var(--es-plum)"
                            : "var(--es-ink)",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        {opt.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-ink)",
                          marginBottom: 2,
                        }}
                      >
                        {opt.detail}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 12,
                          color: "var(--es-mute)",
                        }}
                      >
                        {opt.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Error */}
            {apiError && (
              <div
                role="alert"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "#c0392b",
                  background: "#fdf2f2",
                  border: "1px solid #f5c6c6",
                  padding: "12px 16px",
                  marginBottom: 24,
                }}
              >
                {apiError}
              </div>
            )}

            {/* Pay Button / Waiting State */}
            {waiting ? (
              <WaitingState />
            ) : (
              <button
                type="button"
                className="es-btn-plum"
                style={{ width: "100%" }}
                onClick={handlePay}
                disabled={submitting || items.length === 0}
              >
                {submitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Spinner />
                    Processing…
                  </span>
                ) : (
                  `PAY ${formatKES(total)} →`
                )}
              </button>
            )}
          </div>

          {/* ── Right Column: Order Summary ── */}
          <aside>
            <div
              style={{
                background: "var(--es-white)",
                padding: "32px 28px",
                position: "sticky",
                top: 24,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.45em",
                  textTransform: "uppercase",
                  color: "var(--es-ink)",
                  marginBottom: 24,
                }}
              >
                Order Summary
              </p>

              {/* Cart Items */}
              {items.length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  Your cart is empty.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 24px",
                  }}
                >
                  {items.map((item) => (
                    <li
                      key={item.skuId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 12,
                        paddingBottom: 14,
                        borderBottom: "1px solid var(--es-bone)",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: "var(--font-bodoni)",
                            fontSize: 15,
                            fontWeight: 400,
                            color: "var(--es-ink)",
                          }}
                        >
                          {item.name}
                        </p>
                        {item.size && (
                          <p
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                              marginTop: 2,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            Size: {item.size}
                            {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          color: "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatKES(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Subtotal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    color: "var(--es-mute)",
                  }}
                >
                  Subtotal
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    color: "var(--es-ink)",
                  }}
                >
                  {formatKES(subtotal)}
                </span>
              </div>

              {/* Delivery fee row */}
              {delivery === "door" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 13,
                      color: "var(--es-mute)",
                    }}
                  >
                    Delivery
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 13,
                      color: "var(--es-ink)",
                    }}
                  >
                    {formatKES(DELIVERY_FEE)}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "var(--es-bone)",
                  margin: "16px 0",
                }}
              />

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-bodoni)",
                    fontSize: 24,
                    color: "var(--es-ink)",
                  }}
                >
                  {formatKES(total)}
                </span>
              </div>

              {/* M-Pesa Badge */}
              <MpesaBadge />
            </div>
          </aside>
        </div>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        @media (min-width: 900px) {
          .checkout-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
        input::placeholder {
          color: var(--es-faint);
        }
        input:focus {
          border-bottom-color: var(--es-plum) !important;
        }
      `}</style>
    </div>
  );
}

function WaitingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px",
        background: "var(--es-white)",
        border: "1px solid var(--es-bone)",
        textAlign: "center",
      }}
    >
      <Spinner size={36} />
      <p
        style={{
          fontFamily: "var(--font-bodoni)",
          fontSize: 20,
          color: "var(--es-ink)",
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        Waiting for M-Pesa confirmation…
      </p>
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          color: "var(--es-mute)",
        }}
      >
        Check your Safaricom phone and enter your PIN
      </p>
    </div>
  );
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          border: `3px solid var(--es-bone)`,
          borderTopColor: "var(--es-plum)",
          borderRadius: "50%",
          animation: "es-spin 0.75s linear infinite",
          flexShrink: 0,
        }}
      />
      <style>{`
        @keyframes es-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function MpesaBadge() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#007a39",
        color: "#ffffff",
        padding: "8px 14px",
        borderRadius: 4,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" fill="white" opacity="0.2" />
        <path
          d="M7 12.5L10.5 16L17 8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-inter)",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.1em",
        }}
      >
        M-PESA
      </span>
    </div>
  );
}
