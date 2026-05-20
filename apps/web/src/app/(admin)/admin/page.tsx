import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  { label: "Products", value: "6" },
  { label: "Orders", value: "0" },
  { label: "Revenue", value: "KES 0" },
] as const;

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--es-gold)",
            marginBottom: 8,
          }}
        >
          Overview
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bodoni)",
            fontSize: 36,
            fontWeight: 400,
            color: "var(--es-ink)",
            margin: 0,
          }}
        >
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 24,
        }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--es-white)",
              padding: "28px 24px",
              borderTop: "3px solid var(--es-plum)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-bodoni)",
                fontSize: 36,
                fontWeight: 400,
                color: "var(--es-plum)",
                margin: "0 0 8px",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: 0,
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
