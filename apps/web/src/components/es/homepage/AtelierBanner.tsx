import Link from "next/link";
import { ElitePlate } from "@/components/es/ElitePlate";

const PROMISES = [
  ["Free delivery", "Across all of Kenya — no minimum order"],
  ["M-Pesa checkout", "Pay with your Safaricom number in seconds"],
  ["Easy returns", "7-day hassle-free return policy"],
  ["New arrivals weekly", "Fresh styles added every week"],
] as const;

export function AtelierBanner() {
  return (
    <section style={{ background: "#f6f5f2", padding: "120px 64px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "center",
        }}
        className="!grid-cols-1 lg:!grid-cols-2"
      >
        {/* Image */}
        <div style={{ aspectRatio: "5/4", position: "relative" }}>
          <ElitePlate kind="abstract" tone="bone" />
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 28,
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 10,
              letterSpacing: ".4em",
              color: "#0a0a0a",
              textTransform: "uppercase",
            }}
          >
            NAIROBI&nbsp;·&nbsp;FREE DELIVERY NATIONWIDE
          </div>
        </div>

        {/* Text */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              letterSpacing: ".45em",
              color: "#9b7b3f",
              textTransform: "uppercase",
            }}
          >
            HOW WE WORK
          </div>

          <h2
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-.025em",
              color: "#0a0a0a",
              margin: "22px 0 0",
            }}
          >
            Shop online.
            <br />
            <em style={{ fontWeight: 700, color: "#3d1a4a" }}>We deliver to you.</em>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "#171717",
              marginTop: 26,
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            Browse thousands of curated styles for women, men, and children.
            Add to bag, pay with M-Pesa, and we&apos;ll handle the rest. No fuss,
            no queues — just great fashion at your door.
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "34px 0 0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 28px",
            }}
          >
            {PROMISES.map(([title, sub]) => (
              <li
                key={title}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  paddingBottom: 14,
                  borderBottom: "1px solid rgba(10,10,10,0.10)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: "#c9a961",
                    transform: "rotate(45deg)",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-bodoni), Georgia, serif",
                      fontOpticalSizing: "auto",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#0a0a0a",
                      display: "block",
                    }}
                  >
                    {title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 12,
                      color: "#717171",
                      letterSpacing: ".08em",
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {sub}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Link href="/products" className="es-btn-plum" style={{ display: "inline-block", marginTop: 38 }}>
            BROWSE ALL STYLES
          </Link>
        </div>
      </div>
    </section>
  );
}
