import Link from "next/link";

const FONT = "'Inter','Urbanist',sans-serif";

const CATEGORIES = [
  {
    label: "Women",
    sub: "New arrivals",
    href: "/woman",
    bg: "#1a0a24",
    accent: "#c9a961",
  },
  {
    label: "Men",
    sub: "Sharp looks",
    href: "/man",
    bg: "#0f0f0f",
    accent: "#ffffff",
  },
  {
    label: "Children",
    sub: "Mini style",
    href: "/children",
    bg: "#2d1a0a",
    accent: "#c9a961",
  },
] as const;

export function FamilyEditorial() {
  return (
    <section style={{ background: "#0a0a0a", padding: "72px 40px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
              2026 Collection
            </p>
            <h2 style={{ fontFamily: FONT, fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              Shop by department
            </h2>
          </div>
          <Link
            href="/products"
            style={{
              fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#fff",
              textDecoration: "none", borderBottom: "2px solid #fff", paddingBottom: 2,
              letterSpacing: "0.02em", whiteSpace: "nowrap", opacity: 0.8,
            }}
          >
            View All →
          </Link>
        </div>

        {/* 3-col category grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
          className="!grid-cols-1 md:!grid-cols-3"
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              style={{ textDecoration: "none", display: "block" }}
              className="group"
            >
              {/* Panel */}
              <div
                style={{
                  background: cat.bg,
                  aspectRatio: "3/4",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "32px 28px",
                }}
              >
                {/* Subtle gradient overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
                }} />

                {/* Label */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{
                    fontFamily: FONT, fontSize: 10, fontWeight: 600,
                    color: cat.accent, textTransform: "uppercase",
                    letterSpacing: "0.2em", margin: "0 0 6px",
                  }}>
                    {cat.sub}
                  </p>
                  <p style={{
                    fontFamily: FONT, fontSize: 28, fontWeight: 900,
                    color: "#fff", margin: "0 0 16px", letterSpacing: "-0.02em",
                  }}>
                    {cat.label}
                  </p>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: FONT, fontSize: 11, fontWeight: 700,
                    color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em",
                    borderBottom: "1px solid rgba(255,255,255,0.4)",
                    paddingBottom: 3,
                  }}>
                    Shop Now →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
