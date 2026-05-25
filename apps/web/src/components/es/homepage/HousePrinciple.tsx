const FONT = "'Inter','Urbanist',sans-serif";

const PERKS = [
  {
    title: "Free Delivery",
    body: "Every order, anywhere in Kenya",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    title: "Pay with M-Pesa",
    body: "Your Safaricom number is all you need",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
        <line x1="9" y1="7" x2="15" y2="7"/>
        <line x1="9" y1="11" x2="15" y2="11"/>
      </svg>
    ),
  },
  {
    title: "New Arrivals Weekly",
    body: "Fresh styles added every week",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"/>
        <rect x="1" y="3" width="22" height="5" rx="1"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
    ),
  },
  {
    title: "Easy Returns",
    body: "Hassle-free within 14 days",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-5H1"/>
      </svg>
    ),
  },
];

export function HousePrinciple() {
  return (
    <section style={{
      borderTop: "1px solid #e8e8e8",
      borderBottom: "1px solid #e8e8e8",
      background: "#fff",
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}
          className="!grid-cols-2 lg:!grid-cols-4"
        >
          {PERKS.map((p, i) => (
            <div
              key={p.title}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "26px 28px",
                borderRight: i < PERKS.length - 1 ? "1px solid #e8e8e8" : "none",
              }}
            >
              <div style={{ color: "#111", flexShrink: 0 }}>{p.icon}</div>
              <div>
                <p style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111",
                  margin: "0 0 2px",
                  letterSpacing: "-0.01em",
                }}>
                  {p.title}
                </p>
                <p style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  color: "#888",
                  margin: 0,
                  lineHeight: 1.4,
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
