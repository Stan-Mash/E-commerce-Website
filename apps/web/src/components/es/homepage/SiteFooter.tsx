import Link from "next/link";
import { SUPPORT_WHATSAPP_LINK } from "@/lib/supportConfig";

type FooterItem = { label: string; href: string };
type FooterCol = { h: string; items: FooterItem[] };

const COLS: FooterCol[] = [
  {
    h: "COMPANY",
    items: [
      { label: "About Us",      href: "/atelier" },
      { label: "How It Works",  href: "/atelier#how-it-works" },
      { label: "Contact Us",    href: "/contact" },
      { label: "Partnerships",  href: "/contact" },
    ],
  },
  {
    h: "DEPARTMENTS",
    items: [
      { label: "Woman",        href: "/woman" },
      { label: "Man",          href: "/man" },
      { label: "Children",     href: "/children" },
      { label: "New Arrivals", href: "/products" },
    ],
  },
  {
    h: "SUPPORT",
    items: [
      { label: "Delivery & Returns", href: "/returns" },
      { label: "Sizing Guide",       href: "/sizing-guide" },
      { label: "Track Order",        href: "/track" },
      { label: "Contact Us",         href: "/contact" },
    ],
  },
  {
    h: "CONNECT",
    items: [
      { label: "Instagram", href: "https://instagram.com/elitestyleco" },
      { label: "TikTok",    href: "https://tiktok.com/@elitestyleco" },
      { label: "WhatsApp",  href: SUPPORT_WHATSAPP_LINK },
      { label: "Facebook",  href: "https://facebook.com/elitestyleco" },
    ],
  },
];

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
          <div style={{ fontFamily: "var(--font-inter)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>
            Elite<span style={{ color: "#c9a961" }}>Style</span>
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
            family, free delivery within Nairobi CBD.
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
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 13,
                      letterSpacing: ".06em",
                      color: "rgba(255,255,255,.88)",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
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
        <Link href="/legal" style={{ color: "rgba(255,255,255,.5)", textDecoration: "none" }}>
          PRIVACY · TERMS · COOKIES
        </Link>
        <span>NAIROBI · KENYA</span>
      </div>
    </footer>
  );
}
