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
      { label: "Instagram", href: "https://instagram.com/elit_estyleco" },
      { label: "TikTok",    href: "https://tiktok.com/@elitestyleco0" },
      { label: "WhatsApp",  href: SUPPORT_WHATSAPP_LINK },
      { label: "Facebook",  href: "https://facebook.com/EliteStyle" },
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
            family, fast delivery across Kenya.
          </p>
          {/* Store address */}
          <div style={{ marginTop: 28, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 24 }}>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 9, letterSpacing: ".45em", color: "#c9a961", textTransform: "uppercase", marginBottom: 10 }}>
              Visit Our Store
            </p>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 13, color: "rgba(255,255,255,.85)", lineHeight: 1.7, margin: 0 }}>
              Shop 35, 4th Floor, Wing B<br />
              Stanbank House, Moi Avenue<br />
              Nairobi CBD, Kenya
            </p>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 8 }}>
              Mon – Sat &nbsp;·&nbsp; 9 am – 6 pm EAT
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Stanbank+House+Moi+Avenue+Nairobi"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "#c9a961", textDecoration: "none" }}
              >
                Get Directions →
              </a>
              <span style={{ color: "rgba(255,255,255,.2)" }}>|</span>
              <a
                href="tel:+254142424802"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", textDecoration: "none" }}
              >
                +254 142 424 802
              </a>
            </div>
          </div>

          {/* Payment badges */}
          <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
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
            {col.h === "CONNECT" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Instagram */}
                <Link href="https://instagram.com/elit_estyleco" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </span>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 13, letterSpacing: ".06em", color: "rgba(255,255,255,.88)" }}>@elit_estyleco</span>
                </Link>
                {/* TikTok */}
                <Link href="https://tiktok.com/@elitestyleco0" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#010101", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                  </span>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 13, letterSpacing: ".06em", color: "rgba(255,255,255,.88)" }}>@elitestyleco0</span>
                </Link>
                {/* WhatsApp */}
                <Link href={SUPPORT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 13, letterSpacing: ".06em", color: "rgba(255,255,255,.88)" }}>+254 142 424 802</span>
                </Link>
                {/* Facebook */}
                <Link href="https://facebook.com/EliteStyle" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </span>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 13, letterSpacing: ".06em", color: "rgba(255,255,255,.88)" }}>Elite Style</span>
                </Link>
              </div>
            ) : (
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
            )}
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
