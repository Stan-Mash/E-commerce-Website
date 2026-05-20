const PILLARS = [
  ["01", "Globally sourced",  "We find the best styles from top suppliers worldwide and bring them straight to Nairobi."],
  ["02", "Always KES",        "Every price in Kenyan shillings — no forex surprises, no hidden conversion fees."],
  ["03", "Sizes for everyone","Woman, man, and children. A full range of sizes so the whole family is covered."],
  ["04", "Fast delivery",     "Complimentary delivery across Kenya. Order today and receive it at your door."],
] as const;

export function HousePrinciple() {
  return (
    <section style={{ background: "#f6f5f2", padding: "120px 64px", textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 11,
          letterSpacing: ".45em",
          color: "#9b7b3f",
          marginBottom: 22,
          textTransform: "uppercase",
        }}
      >
        WHY ELITE STYLE CO.
      </div>

      <h2
        style={{
          fontFamily: "var(--font-bodoni), Georgia, serif",
          fontOpticalSizing: "auto",
          fontSize: "clamp(40px, 6vw, 72px)",
          fontWeight: 700,
          color: "#0a0a0a",
          letterSpacing: "-.025em",
          lineHeight: 1.05,
          margin: "0 auto",
          maxWidth: 1100,
        }}
      >
        International style. Nairobi prices.
        <em style={{ color: "#3d1a4a", fontWeight: 700 }}> Delivered to your door.</em>
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 48,
          marginTop: 88,
          textAlign: "left",
        }}
        className="!grid-cols-2 lg:!grid-cols-4"
      >
        {PILLARS.map(([n, h, b]) => (
          <div key={n}>
            <div
              style={{
                fontFamily: "var(--font-bodoni), Georgia, serif",
                fontSize: 14,
                fontStyle: "italic",
                color: "#9b7b3f",
                letterSpacing: ".2em",
              }}
            >
              № {n}
            </div>
            <div
              style={{
                fontFamily: "var(--font-bodoni), Georgia, serif",
                fontOpticalSizing: "auto",
                fontSize: 22,
                fontWeight: 600,
                color: "#0a0a0a",
                marginTop: 10,
                letterSpacing: "-.005em",
              }}
            >
              {h}
            </div>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 14,
                color: "#717171",
                marginTop: 8,
                lineHeight: 1.55,
              }}
            >
              {b}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
