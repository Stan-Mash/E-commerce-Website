"use client";

import Link from "next/link";

const FONT = "'Inter','Urbanist',sans-serif";

const CATS = [
  { label: "Women",       sub: "New arrivals",     href: "/woman" },
  { label: "Men",         sub: "Sharp looks",      href: "/man" },
  { label: "Children",    sub: "Mini style",       href: "/children" },
  { label: "New In",      sub: "Just dropped",     href: "/products" },
];

interface HeroProps {
  /** Real count of purchasable (active) products, shown as social proof. */
  productCount?: number;
}

export function Hero({ productCount }: HeroProps = {}) {
  // Show a tidy "N+" only when we genuinely have a meaningful catalogue;
  // otherwise fall back to an honest label rather than an inflated number.
  const stylesValue =
    productCount && productCount >= 10
      ? `${Math.floor(productCount / 10) * 10}+`
      : productCount && productCount > 0
        ? `${productCount}`
        : "New";

  return (
    <section>
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-headline {
          animation: fadeInUp 0.7s ease-out 0.1s both;
        }

        .hero-subtitle {
          animation: fadeInUp 0.7s ease-out 0.3s both;
        }

        .hero-cta {
          animation: fadeInUp 0.7s ease-out 0.5s both;
        }

        .hero-img {
          animation: kenburns 16s ease-in-out infinite alternate;
        }

        .hero-cat-link:hover {
          background: #fafafa !important;
        }
      `}</style>

      {/* ── Main hero — split layout ──────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "86vh",
      }} className="!grid-cols-1 md:!grid-cols-2">

        {/* Image panel */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          background: "#f0ebe3",
          minHeight: 520,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/tweed-set-black-white.jpg"
            alt="New collection — Tweed Jacket & Skirt Set"
            className="hero-img"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
          {/* Season badge */}
          <div style={{
            position: "absolute",
            top: 24,
            left: 24,
            background: "#111",
            color: "#fff",
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "7px 16px",
          }}>
            New Season 2026
          </div>
          {/* Delivery badge */}
          <div style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            background: "rgba(255,255,255,0.96)",
            padding: "12px 20px",
            backdropFilter: "blur(8px)",
          }}>
            <p style={{ fontFamily: FONT, fontSize: 10, color: "#888", margin: "0 0 3px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Free delivery
            </p>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111", margin: 0 }}>
              Within Nairobi CBD 🇰🇪
            </p>
          </div>
        </div>

        {/* Text panel */}
        <div style={{
          padding: "72px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#fff",
        }} className="!p-8 md:!p-16">
          <span style={{
            display: "inline-block",
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            color: "#3d1a4a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            Elite Style Co. · Nairobi
          </span>

          <h1
            className="hero-headline"
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: "clamp(42px, 5.5vw, 76px)",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: "#111",
              margin: "0 0 24px",
            }}
          >
            Dressed<br />for every<br />moment.
          </h1>

          <p
            className="hero-subtitle"
            style={{
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 400,
              color: "#555",
              lineHeight: 1.75,
              maxWidth: 400,
              margin: "0 0 40px",
            }}
          >
            Curated fashion for the whole family — KES pricing,
            M-Pesa &amp; card checkout, free delivery within Nairobi CBD.
          </p>

          <div className="hero-cta" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111",
                color: "#fff",
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "15px 36px",
                textDecoration: "none",
                transition: "background .15s",
              }}
            >
              Shop New Arrivals
            </Link>
            <Link
              href="/woman"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                color: "#111",
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "15px 36px",
                border: "2px solid #111",
                textDecoration: "none",
                transition: "all .15s",
              }}
            >
              Women&apos;s Edit
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {[
              { num: stylesValue, label: "Styles" },
              { num: "CBD", label: "Free delivery" },
              { num: "M-Pesa", label: "Accepted" },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 2px", letterSpacing: "-0.03em" }}>
                  {s.num}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: "#888", margin: 0, letterSpacing: "0.05em" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category strip ───────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: "1px solid #e8e8e8",
        borderBottom: "1px solid #e8e8e8",
        background: "#fff",
      }} className="!grid-cols-2 md:!grid-cols-4">
        {CATS.map((cat, i) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="hero-cat-link"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 28px",
              textDecoration: "none",
              borderRight: i < CATS.length - 1 ? "1px solid #e8e8e8" : "none",
              transition: "background .15s",
              background: "#fff",
            }}
          >
            <div>
              <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
                {cat.sub}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>
                {cat.label}
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
