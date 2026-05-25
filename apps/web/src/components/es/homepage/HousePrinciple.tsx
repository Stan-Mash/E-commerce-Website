const FONT = "'Inter','Urbanist',sans-serif";

const PERKS = [
  {
    icon: "🚚",
    title: "Free Delivery",
    body: "Complimentary delivery across all of Kenya on every order.",
  },
  {
    icon: "💳",
    title: "Pay with M-Pesa",
    body: "Checkout instantly with M-Pesa — no card required.",
  },
  {
    icon: "📦",
    title: "New Arrivals Weekly",
    body: "Fresh styles added every week from global suppliers.",
  },
  {
    icon: "↩️",
    title: "Easy Returns",
    body: "Hassle-free returns within 14 days of delivery.",
  },
] as const;

export function HousePrinciple() {
  return (
    <section style={{ background: "#f7f7f7", borderBottom: "1px solid #e8e8e8" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "56px 40px" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}
          className="!grid-cols-2 lg:!grid-cols-4"
        >
          {PERKS.map((p) => (
            <div key={p.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{p.icon}</span>
              <div>
                <p style={{
                  fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#111",
                  margin: "0 0 6px", letterSpacing: "-0.01em",
                }}>
                  {p.title}
                </p>
                <p style={{
                  fontFamily: FONT, fontSize: 13, color: "#666",
                  margin: 0, lineHeight: 1.55,
                }}>
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
