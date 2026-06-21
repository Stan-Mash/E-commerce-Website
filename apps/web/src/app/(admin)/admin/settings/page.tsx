"use client";

import { useState, useEffect, useCallback } from "react";

const INPUT_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--es-bone)",
  borderRadius: 4,
  background: "var(--es-white)",
  fontFamily: "var(--font-inter)",
  fontSize: 14,
  color: "var(--es-ink)",
  outline: "none",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: "vertical",
  minHeight: 80,
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-inter)",
  fontSize: 11,
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: "var(--es-mute)",
  marginBottom: 6,
};

const CARD_STYLE: React.CSSProperties = {
  background: "var(--es-white)",
  padding: "32px 36px 28px",
  marginBottom: 32,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-bodoni)",
  fontSize: 22,
  fontWeight: 400,
  color: "var(--es-ink)",
  margin: "0 0 24px",
  paddingBottom: 16,
  borderBottom: "1px solid var(--es-bone)",
};

const FIELD_STYLE: React.CSSProperties = {
  marginBottom: 20,
};

const SAVE_BTN_STYLE: React.CSSProperties = {
  padding: "10px 28px",
  background: "var(--es-ink)",
  color: "var(--es-white)",
  border: "none",
  fontFamily: "var(--font-inter)",
  fontSize: 11,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  cursor: "pointer",
  borderRadius: 2,
};

interface Settings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  whatsapp_number: string;
  door_delivery_fee: string;
  free_delivery_threshold: string;
  delivery_note: string;
  announcement_bar_text: string;
  announcement_bar_enabled: string;
  low_stock_threshold: string;
}

const DEFAULTS: Settings = {
  store_name: "Elite Style Co.",
  store_email: "",
  store_phone: "",
  store_address: "",
  whatsapp_number: "",
  door_delivery_fee: "250",
  free_delivery_threshold: "0",
  delivery_note: "",
  announcement_bar_text: "",
  announcement_bar_enabled: "false",
  low_stock_threshold: "5",
};

type SectionKey = "store" | "delivery" | "appearance" | "stock";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<SectionKey, boolean>>({
    store: false,
    delivery: false,
    appearance: false,
    stock: false,
  });
  const [status, setStatus] = useState<Record<SectionKey, { ok: boolean; msg: string } | null>>({
    store: null,
    delivery: null,
    appearance: null,
    stock: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (res.ok) {
        const data = (await res.json()) as Settings;
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // ignore, use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function update(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save(section: SectionKey, keys: Array<keyof Settings>) {
    setSaving((prev) => ({ ...prev, [section]: true }));
    setStatus((prev) => ({ ...prev, [section]: null }));
    try {
      const payload: Record<string, string> = {};
      for (const k of keys) payload[k] = settings[k];

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus((prev) => ({ ...prev, [section]: { ok: true, msg: "Saved successfully." } }));
      } else {
        const err = (await res.json()) as { error?: string };
        setStatus((prev) => ({
          ...prev,
          [section]: { ok: false, msg: err.error ?? "Failed to save." },
        }));
      }
    } catch {
      setStatus((prev) => ({ ...prev, [section]: { ok: false, msg: "Network error." } }));
    } finally {
      setSaving((prev) => ({ ...prev, [section]: false }));
    }
  }

  function SectionStatus({ section }: { section: SectionKey }) {
    const s = status[section];
    if (!s) return null;
    return (
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 13,
          color: s.ok ? "#2e7d32" : "#c0392b",
          margin: "12px 0 0",
        }}
      >
        {s.msg}
      </p>
    );
  }

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
            Configuration
          </p>
          <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, fontWeight: 400, color: "var(--es-ink)", margin: 0 }}>
            Settings
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)", fontSize: 14 }}>
          Loading settings…
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
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
          Configuration
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
          Settings
        </h1>
      </div>

      {/* Store Section */}
      <div style={CARD_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Store</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>Store Name</label>
            <input
              style={INPUT_STYLE}
              type="text"
              value={settings.store_name}
              onChange={(e) => update("store_name", e.target.value)}
              placeholder="Elite Style Co."
            />
          </div>

          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>Store Email</label>
            <input
              style={INPUT_STYLE}
              type="email"
              value={settings.store_email}
              onChange={(e) => update("store_email", e.target.value)}
              placeholder="hello@elitestyleco.com"
            />
          </div>

          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>Store Phone</label>
            <input
              style={INPUT_STYLE}
              type="text"
              value={settings.store_phone}
              onChange={(e) => update("store_phone", e.target.value)}
              placeholder="+254 700 000 000"
            />
          </div>

          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>WhatsApp Number</label>
            <input
              style={INPUT_STYLE}
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => update("whatsapp_number", e.target.value)}
              placeholder="+254 700 000 000"
            />
          </div>
        </div>

        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Store Address</label>
          <textarea
            style={TEXTAREA_STYLE}
            value={settings.store_address}
            onChange={(e) => update("store_address", e.target.value)}
            placeholder="123 Fashion Street, Nairobi, Kenya"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <button
            style={{
              ...SAVE_BTN_STYLE,
              opacity: saving.store ? 0.6 : 1,
            }}
            disabled={saving.store}
            onClick={() =>
              void save("store", [
                "store_name",
                "store_email",
                "store_phone",
                "store_address",
                "whatsapp_number",
              ])
            }
          >
            {saving.store ? "Saving…" : "Save Store Settings"}
          </button>
        </div>
        <SectionStatus section="store" />
      </div>

      {/* Delivery Section */}
      <div style={CARD_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Delivery</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>Door Delivery Fee (KES)</label>
            <input
              style={INPUT_STYLE}
              type="number"
              min="0"
              value={settings.door_delivery_fee}
              onChange={(e) => update("door_delivery_fee", e.target.value)}
              placeholder="250"
            />
          </div>

          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>Free Delivery Threshold (KES)</label>
            <input
              style={INPUT_STYLE}
              type="number"
              min="0"
              value={settings.free_delivery_threshold}
              onChange={(e) => update("free_delivery_threshold", e.target.value)}
              placeholder="0"
            />
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                color: "var(--es-mute)",
                margin: "6px 0 0",
              }}
            >
              Orders above this amount get free delivery. Set to 0 to disable.
            </p>
          </div>
        </div>

        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Delivery Note</label>
          <textarea
            style={TEXTAREA_STYLE}
            value={settings.delivery_note}
            onChange={(e) => update("delivery_note", e.target.value)}
            placeholder="Delivery takes 1–3 business days within Nairobi…"
          />
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              color: "var(--es-mute)",
              margin: "6px 0 0",
            }}
          >
            Shown to customers at checkout.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <button
            style={{
              ...SAVE_BTN_STYLE,
              opacity: saving.delivery ? 0.6 : 1,
            }}
            disabled={saving.delivery}
            onClick={() =>
              void save("delivery", [
                "door_delivery_fee",
                "free_delivery_threshold",
                "delivery_note",
              ])
            }
          >
            {saving.delivery ? "Saving…" : "Save Delivery Settings"}
          </button>
        </div>
        <SectionStatus section="delivery" />
      </div>

      {/* Appearance Section */}
      <div style={CARD_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Appearance</h2>

        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Announcement Bar Text</label>
          <input
            style={INPUT_STYLE}
            type="text"
            value={settings.announcement_bar_text}
            onChange={(e) => update("announcement_bar_text", e.target.value)}
            placeholder="Free delivery on orders over KES 5,000 · New arrivals every Friday"
          />
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              color: "var(--es-mute)",
              margin: "6px 0 0",
            }}
          >
            The scrolling text shown at the top of the storefront.
          </p>
        </div>

        <div style={{ ...FIELD_STYLE, display: "flex", alignItems: "center", gap: 12 }}>
          <input
            id="announcement-enabled"
            type="checkbox"
            checked={settings.announcement_bar_enabled === "true"}
            onChange={(e) => update("announcement_bar_enabled", e.target.checked ? "true" : "false")}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--es-gold)" }}
          />
          <label
            htmlFor="announcement-enabled"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "var(--es-ink)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Enable announcement bar
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <button
            style={{
              ...SAVE_BTN_STYLE,
              opacity: saving.appearance ? 0.6 : 1,
            }}
            disabled={saving.appearance}
            onClick={() =>
              void save("appearance", ["announcement_bar_text", "announcement_bar_enabled"])
            }
          >
            {saving.appearance ? "Saving…" : "Save Appearance Settings"}
          </button>
        </div>
        <SectionStatus section="appearance" />
      </div>

      {/* Stock Section */}
      <div style={CARD_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Stock Alerts</h2>

        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Low Stock Threshold</label>
          <input
            style={{ ...INPUT_STYLE, maxWidth: 180 }}
            type="number"
            min="1"
            value={settings.low_stock_threshold}
            onChange={(e) => update("low_stock_threshold", e.target.value)}
            placeholder="5"
          />
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", margin: "6px 0 0" }}>
            SKUs with stock at or below this number show as &ldquo;Low Stock&rdquo; in the admin and dashboard alerts.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <button
            style={{ ...SAVE_BTN_STYLE, opacity: saving.stock ? 0.6 : 1 }}
            disabled={saving.stock}
            onClick={() => void save("stock", ["low_stock_threshold"])}
          >
            {saving.stock ? "Saving…" : "Save Stock Settings"}
          </button>
        </div>
        <SectionStatus section="stock" />
      </div>
    </div>
  );
}
