import Link from "next/link";
import { ElitePlate } from "@/components/es/ElitePlate";

const DEPTS = [
  { dept: "WOMAN",    line: "The styles she's been waiting for.",  tone: "warm"  as const, kind: "woman" as const },
  { dept: "MAN",      line: "Sharp looks. Straight to your door.", tone: "smoke" as const, kind: "man"   as const },
  { dept: "CHILDREN", line: "Great fits for small grown-ups.",     tone: "sand"  as const, kind: "child" as const },
];

export function Hero() {
  return (
    <section style={{ background: "#ffffff", padding: "88px 64px 40px" }}>
      {/* Headline + body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 56,
          alignItems: "end",
          marginBottom: 56,
        }}
        className="!grid-cols-1 md:!grid-cols-2"
      >
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
            NEW SEASON&nbsp;&nbsp;·&nbsp;&nbsp;NAIROBI'S FAVOURITE FASHION STORE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: "clamp(64px, 8vw, 112px)",
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: "-.03em",
              color: "#0a0a0a",
              margin: "24px 0 0",
            }}
          >
            Style,
            <br />
            <em style={{ fontWeight: 700 }}>delivered</em>
            <br />
            to your door.
          </h1>
        </div>

        <div style={{ paddingBottom: 12 }}>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "#171717",
              lineHeight: 1.6,
              maxWidth: 460,
              fontWeight: 400,
            }}
          >
            Curated fashion for the whole family — sourced from the world&apos;s
            best suppliers and priced in KES. Shop woman, man, and children. Pay
            with M-Pesa. Delivered free across Kenya.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 28,
            }}
          >
            <Link href="/products" className="es-btn-plum">
              SHOP NEW ARRIVALS
            </Link>
            <Link href="/products" className="es-btn-outline-ink">
              VIEW ALL STYLES
            </Link>
          </div>
        </div>
      </div>

      {/* Department triptych */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
        className="!grid-cols-1 sm:!grid-cols-3"
      >
        {DEPTS.map((d) => {
          const isLight = d.tone === "sand";
          const textColor = isLight ? "#0a0a0a" : "#ffffff";
          return (
            <Link
              key={d.dept}
              href={`/${d.dept.toLowerCase()}`}
              style={{ aspectRatio: "4/5", position: "relative", overflow: "hidden", display: "block", textDecoration: "none" }}
            >
              <ElitePlate kind={d.kind} tone={d.tone} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: "28px 30px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  color: textColor,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 10,
                      letterSpacing: ".45em",
                      opacity: 0.85,
                      textTransform: "uppercase",
                    }}
                  >
                    SHOP
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-bodoni), Georgia, serif",
                      fontOpticalSizing: "auto",
                      fontSize: 42,
                      fontWeight: 700,
                      marginTop: 8,
                      letterSpacing: "-.01em",
                    }}
                  >
                    {d.dept}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-cormorant), Georgia, serif",
                      fontStyle: "italic",
                      fontSize: 18,
                      maxWidth: 220,
                      lineHeight: 1.35,
                    }}
                  >
                    {d.line}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 10,
                      letterSpacing: ".34em",
                      borderBottom: "1px solid currentColor",
                      paddingBottom: 3,
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                    }}
                  >
                    SHOP NOW →
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
