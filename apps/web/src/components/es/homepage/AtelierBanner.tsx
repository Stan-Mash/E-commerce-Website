import Link from "next/link";

const FONT = "'Inter','Urbanist',sans-serif";

const STEPS = [
  { n: "01", title: "Browse", detail: "Explore thousands of curated styles for women, men and children — all KES priced." },
  { n: "02", title: "Add to bag", detail: "Select your size and add to cart. No account required to shop." },
  { n: "03", title: "Pay with M-Pesa", detail: "Enter your Safaricom number at checkout. Confirm the push prompt. Done." },
  { n: "04", title: "We deliver", detail: "Your order ships free to your door anywhere in Kenya. Track it in real time." },
] as const;

export function AtelierBanner() {
  return (
    <section style={{ background: "#f7f7f7", borderTop: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8", padding: "80px 40px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
              How it works
            </p>
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.03em" }}>
              From browse to your door in 4 steps
            </h2>
          </div>
          <Link
            href="/products"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "#111", color: "#fff",
              fontFamily: FONT, fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "13px 28px", textDecoration: "none",
            }}
          >
            Start Shopping →
          </Link>
        </div>

        {/* Steps grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}
          className="!grid-cols-2 lg:!grid-cols-4"
        >
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                padding: "32px 28px",
                borderRight: i < STEPS.length - 1 ? "1px solid #e0e0e0" : "none",
                borderTop: "3px solid transparent",
              }}
              className="step-card"
            >
              <span style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 800,
                color: "#c9a961",
                letterSpacing: "0.15em",
                display: "block",
                marginBottom: 16,
              }}>
                {s.n}
              </span>
              <h3 style={{
                fontFamily: FONT,
                fontSize: 16,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 10px",
                letterSpacing: "-0.02em",
              }}>
                {s.title}
              </h3>
              <p style={{
                fontFamily: FONT,
                fontSize: 13,
                color: "#666",
                margin: 0,
                lineHeight: 1.6,
              }}>
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
