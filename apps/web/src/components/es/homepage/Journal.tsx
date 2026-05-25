import Link from "next/link";

const FONT = "'Inter','Urbanist',sans-serif";

const POSTS = [
  {
    tag: "Style Notes",
    title: "Dressing for the boardroom you haven't seen yet.",
    desc: "A four-piece capsule that works from 8am meetings to evening dinners — and why less is always more.",
    readTime: "4 min read",
    accent: "#3d1a4a",
  },
  {
    tag: "How It Works",
    title: "Why M-Pesa checkout is the only way to shop in Kenya.",
    desc: "No card. No foreign fees. Just your Safaricom number and a PIN. Here's why 15 million Kenyans agree.",
    readTime: "3 min read",
    accent: "#c9a961",
  },
  {
    tag: "New Arrivals",
    title: "The pieces our buyers picked first this season.",
    desc: "From the tweed co-ord to the everyday tote — our lead buyer breaks down what sold out in 48 hours.",
    readTime: "5 min read",
    accent: "#111",
  },
] as const;

export function Journal() {
  return (
    <section style={{ background: "#fff", padding: "80px 40px", borderTop: "1px solid #e8e8e8" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 48,
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
              Journal
            </p>
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.03em" }}>
              From the EliteStyle edit
            </h2>
          </div>
          <Link
            href="/journal"
            style={{
              fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111",
              textDecoration: "none", borderBottom: "2px solid #111", paddingBottom: 2,
              letterSpacing: "0.02em", whiteSpace: "nowrap",
            }}
          >
            All Articles →
          </Link>
        </div>

        {/* 3-col posts */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#e8e8e8" }}
          className="!grid-cols-1 md:!grid-cols-3"
        >
          {POSTS.map((p) => (
            <article
              key={p.title}
              style={{ background: "#fff", padding: "40px 32px" }}
              className="group"
            >
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  fontFamily: FONT, fontSize: 10, fontWeight: 700,
                  color: "#fff", background: p.accent,
                  padding: "4px 10px", letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  {p.tag}
                </span>
              </div>

              <h3 style={{
                fontFamily: FONT,
                fontSize: "clamp(18px, 2vw, 22px)",
                fontWeight: 800,
                color: "#111",
                margin: "0 0 14px",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}>
                {p.title}
              </h3>

              <p style={{
                fontFamily: FONT,
                fontSize: 13,
                color: "#666",
                lineHeight: 1.65,
                margin: "0 0 28px",
              }}>
                {p.desc}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontFamily: FONT, fontSize: 11, color: "#aaa", letterSpacing: "0.05em",
                }}>
                  {p.readTime}
                </span>
                <Link
                  href="/journal"
                  style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#111",
                    textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase",
                    borderBottom: "1px solid #111", paddingBottom: 2,
                  }}
                >
                  Read →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
