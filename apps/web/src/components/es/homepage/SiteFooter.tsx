import Link from "next/link";
import { GoldCrown } from "@/components/es/GoldCrown";

const COLS = [
  { h: "COMPANY",     items: ["About Us", "How It Works", "Contact Us", "Press"] },
  { h: "DEPARTMENTS", items: ["Woman", "Man", "Children", "Gift Cards"] },
  { h: "SUPPORT",     items: ["Delivery", "Returns", "Sizing Guide", "Track Order"] },
  { h: "CONNECT",     items: ["Instagram", "TikTok", "WhatsApp", "Facebook"] },
] as const;

const PAYMENT_METHODS = ["VISA", "MASTERCARD", "M-PESA"] as const;

export function SiteFooter() {
  return (
    <footer style={{ background: "#0a0a0a", color: "#ffffff", padding: "88px 64px 36px" }}>
      {/* 5-col grid: brand col + 4 link cols */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr repeat(4, 1fr)",
          gap: 56,
          alignItems: "start",
        }}
        className="!grid-cols-2 lg:!grid-cols-[1.4fr_repeat(4,1fr)]"
      >
        {/* Brand */}
        <div>
          <GoldCrown size={28} />
          <div
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: 26,
              fontWeight: 800,
              marginTop: 12,
              letterSpacing: "-.005em",
            }}
          >
            Elite Style Co.
          </div>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,.7)",
              marginTop: 16,
              maxWidth: 320,
              lineHeight: 1.6,
            }}
          >
            Nairobi&apos;s go-to online fashion store — curated styles for the whole
            family, delivered free across Kenya.
          </p>
          {/* Payment badges */}
          <div style={{ display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap" }}>
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 9,
                  letterSpacing: ".35em",
                  color: "rgba(255,255,255,.55)",
                  border: "1px solid rgba(255,255,255,.18)",
                  padding: "7px 11px",
                  textTransform: "uppercase",
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {COLS.map((col) => (
          <div key={col.h}>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 10,
                letterSpacing: ".45em",
                color: "#c9a961",
                marginBottom: 20,
                textTransform: "uppercase",
              }}
            >
              {col.h}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {col.items.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 13,
                      letterSpacing: ".06em",
                      color: "rgba(255,255,255,.88)",
                      textDecoration: "none",
                    }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.14)",
          marginTop: 64,
          paddingTop: 22,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 10,
          letterSpacing: ".32em",
          color: "rgba(255,255,255,.5)",
          textTransform: "uppercase",
        }}
      >
        <span>© MMXXVI · ELITE STYLE CO.</span>
        <span>PRIVACY · TERMS · COOKIES</span>
        <span>NAIROBI · KENYA</span>
      </div>
    </footer>
  );
}
