"use client";

import { useState, useEffect, useCallback } from "react";

interface Promotion {
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
  created_at: string;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDiscount(p: Promotion): string {
  if (p.type === "percentage")   return `${p.value}% OFF`;
  if (p.type === "fixed_amount") return `${formatKES(p.value)} OFF`;
  return "Free Shipping";
}

function formatExpiry(expires_at: string | null): string {
  if (!expires_at) return "—";
  return new Date(expires_at).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontFamily: "var(--font-inter)",
  fontSize: 13,
  color: "var(--es-ink)",
  background: "var(--es-white)",
  border: "1px solid var(--es-bone)",
  borderRadius: 4,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-inter)",
  fontSize: 11,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--es-mute)",
  marginBottom: 6,
};

// Toggle switch component
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? "var(--es-gold)" : "#d0d0d0",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 2,
        transition: "background 0.2s",
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s",
        }}
      />
    </button>
  );
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode]         = useState("");
  const [formName, setFormName]         = useState("");
  const [formType, setFormType]         = useState<"percentage" | "fixed_amount">("percentage");
  const [formValue, setFormValue]       = useState("");
  const [formMinSpend, setFormMinSpend] = useState("0");
  const [formMaxUses, setFormMaxUses]   = useState("0");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formActive, setFormActive]     = useState(true);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const json = await res.json() as { promotions: Promotion[] };
        setPromotions(json.promotions ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  function resetForm() {
    setFormCode("");
    setFormName("");
    setFormType("percentage");
    setFormValue("");
    setFormMinSpend("0");
    setFormMaxUses("0");
    setFormExpiresAt("");
    setFormActive(true);
    setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim()) {
      setFormError("Promo code is required.");
      return;
    }
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }
    const numValue = parseFloat(formValue);
    if (isNaN(numValue) || numValue <= 0) {
      setFormError("Value must be a positive number.");
      return;
    }
    if (formType === "percentage" && numValue > 100) {
      setFormError("Percentage cannot exceed 100.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       formName.trim(),
          code:       formCode.trim().toUpperCase(),
          type:       formType,
          value:      numValue,
          min_spend:  parseFloat(formMinSpend) || null,
          max_uses:   parseInt(formMaxUses, 10) || null,
          expires_at: formExpiresAt || null,
          active:     formActive,
        }),
      });
      const json = await res.json() as { promotion?: Promotion; error?: string };
      if (!res.ok) {
        setFormError(json.error ?? "Failed to create promotion.");
        return;
      }
      if (json.promotion) {
        setPromotions((prev) => [json.promotion!, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(promo: Promotion) {
    setTogglingId(promo.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !promo.active }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, active: !promo.active } : p))
        );
      }
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  async function executeDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/promotions/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== deleteId));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const promoToDelete = promotions.find((p) => p.id === deleteId);
  const colHeaders = ["Code", "Type / Value", "Min Order", "Usage", "Active", "Expires", ""];

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              marginBottom: 8,
            }}
          >
            Marketing
          </p>
          <h1
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--es-ink)",
              margin: 0,
            }}
          >
            Promotions
          </h1>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            if (!showForm) resetForm();
          }}
          className="es-btn-plum"
          style={{ flexShrink: 0 }}
        >
          {showForm ? "Cancel" : "+ Create Promo Code"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          style={{
            background: "var(--es-white)",
            border: "1px solid var(--es-bone)",
            borderRadius: 8,
            padding: "32px 36px",
            marginBottom: 40,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 22,
              fontWeight: 400,
              color: "var(--es-ink)",
              margin: "0 0 24px",
            }}
          >
            New Promo Code
          </h2>

          <form onSubmit={(e) => void handleCreate(e)}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px 24px",
                marginBottom: 24,
              }}
            >
              {/* Code */}
              <div>
                <label style={labelStyle}>Code</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    maxLength={32}
                    style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-inter)", fontWeight: 600, letterSpacing: "0.1em" }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormCode(generateCode())}
                    title="Auto-generate"
                    style={{
                      padding: "10px 12px",
                      background: "var(--es-ink)",
                      color: "var(--es-white)",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontFamily: "var(--font-inter)",
                      fontSize: 11,
                      letterSpacing: "0.15em",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Name / Description</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Summer Sale 20%"
                  style={inputStyle}
                />
              </div>

              {/* Value */}
              <div>
                <label style={labelStyle}>Value</label>
                <input
                  type="number"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder={formType === "percentage" ? "e.g. 20" : "e.g. 500"}
                  min={0.01}
                  step="0.01"
                  style={inputStyle}
                />
              </div>

              {/* Min order */}
              <div>
                <label style={labelStyle}>Min Order (KES, 0 = none)</label>
                <input
                  type="number"
                  value={formMinSpend}
                  onChange={(e) => setFormMinSpend(e.target.value)}
                  min={0}
                  step="0.01"
                  style={inputStyle}
                />
              </div>

              {/* Usage limit */}
              <div>
                <label style={labelStyle}>Usage Limit (0 = unlimited)</label>
                <input
                  type="number"
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  min={0}
                  step={1}
                  style={inputStyle}
                />
              </div>

              {/* Expires at */}
              <div>
                <label style={labelStyle}>Expires At (optional)</label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Type row */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Discount Type</label>
              <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                {(
                  [
                    { value: "percentage",   label: "Percentage OFF" },
                    { value: "fixed_amount", label: "Fixed KES Amount" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontFamily: "var(--font-inter)",
                      fontSize: 13,
                      color: "var(--es-ink)",
                    }}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={opt.value}
                      checked={formType === opt.value}
                      onChange={() => setFormType(opt.value)}
                      style={{ accentColor: "var(--es-plum)", width: 15, height: 15 }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Active toggle row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <Toggle checked={formActive} onChange={setFormActive} />
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "var(--es-ink)",
                }}
              >
                {formActive ? "Active" : "Inactive"}
              </span>
            </div>

            {formError && (
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "#c0392b",
                  marginBottom: 20,
                  padding: "10px 14px",
                  background: "#fdf2f2",
                  borderRadius: 4,
                  border: "1px solid #f5c6cb",
                }}
              >
                {formError}
              </p>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 32px",
                  background: submitting ? "#999" : "var(--es-plum)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {submitting ? "Saving…" : "Create Code"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  color: "var(--es-ink)",
                  border: "1px solid var(--es-bone)",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-inter)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {colHeaders.map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 20px",
                    textAlign: i === colHeaders.length - 1 ? "right" : "left",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-white)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={colHeaders.length}
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                    background: "var(--es-white)",
                  }}
                >
                  Loading promotions…
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td
                  colSpan={colHeaders.length}
                  style={{
                    padding: "64px 20px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                    background: "var(--es-white)",
                  }}
                >
                  No promo codes yet. Create your first one above.
                </td>
              </tr>
            ) : (
              promotions.map((promo, index) => {
                const isEven = index % 2 === 0;
                const isExpired =
                  promo.expires_at !== null && new Date(promo.expires_at) < new Date();
                const isCapped =
                  promo.max_uses !== null && promo.uses_count >= promo.max_uses;

                return (
                  <tr
                    key={promo.id}
                    style={{
                      background: isEven ? "var(--es-white)" : "var(--es-paper)",
                    }}
                  >
                    {/* Code */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--es-ink)",
                          }}
                        >
                          {promo.code ?? <span style={{ color: "var(--es-mute)", fontWeight: 400, fontStyle: "italic" }}>auto-applied</span>}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 11,
                            color: "var(--es-mute)",
                          }}
                        >
                          {promo.name}
                        </span>
                      </div>
                    </td>

                    {/* Type / Value */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontFamily: "var(--font-inter)",
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          color:
                            promo.type === "percentage"
                              ? "var(--es-plum)"
                              : promo.type === "fixed_amount"
                              ? "#2e7d32"
                              : "#1565c0",
                          background:
                            promo.type === "percentage"
                              ? "var(--es-plum-lt)"
                              : promo.type === "fixed_amount"
                              ? "#e8f5e9"
                              : "#e3f2fd",
                          padding: "4px 10px",
                          borderRadius: 2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDiscount(promo)}
                      </span>
                    </td>

                    {/* Min Order */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: promo.min_spend ? "var(--es-ink)" : "var(--es-mute)",
                        }}
                      >
                        {promo.min_spend ? formatKES(promo.min_spend) : "None"}
                      </span>
                    </td>

                    {/* Usage */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: isCapped ? "#c0392b" : "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {promo.uses_count}
                        {promo.max_uses !== null ? ` / ${promo.max_uses}` : " / ∞"}
                        {isCapped && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              color: "#c0392b",
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                            }}
                          >
                            Capped
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Active toggle */}
                    <td style={{ padding: "16px 20px" }}>
                      <Toggle
                        checked={promo.active}
                        onChange={() => void toggleActive(promo)}
                        disabled={togglingId === promo.id}
                      />
                    </td>

                    {/* Expires */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: isExpired ? "#c0392b" : "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatExpiry(promo.expires_at)}
                        {isExpired && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              color: "#c0392b",
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                            }}
                          >
                            Expired
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Delete */}
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => setDeleteId(promo.id)}
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 12,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#c0392b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary line */}
      {!loading && promotions.length > 0 && (
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            color: "var(--es-mute)",
            marginTop: 16,
            letterSpacing: "0.05em",
          }}
        >
          {promotions.length} promo code{promotions.length !== 1 ? "s" : ""} total ·{" "}
          {promotions.filter((p) => p.active).length} active
        </p>
      )}

      {/* Delete confirmation modal */}
      {deleteId && promoToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "var(--es-white)",
              borderRadius: 8,
              padding: "40px 36px",
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-bodoni)",
                fontSize: 24,
                fontWeight: 400,
                color: "var(--es-ink)",
                margin: "0 0 12px",
              }}
            >
              Delete Promo Code
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-mute)",
                lineHeight: 1.6,
                margin: "0 0 32px",
              }}
            >
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--es-ink)", letterSpacing: "0.08em" }}>
                {promoToDelete.code ?? promoToDelete.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => void executeDelete()}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "#c0392b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "transparent",
                  color: "var(--es-ink)",
                  border: "1px solid var(--es-bone)",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
