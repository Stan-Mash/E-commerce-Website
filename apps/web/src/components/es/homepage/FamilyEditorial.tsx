import { ElitePlate } from "@/components/es/ElitePlate";
import Link from "next/link";

export function FamilyEditorial() {
  return (
    <section style={{ background: "#0a0a0a", color: "#ffffff", padding: 0 }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", minHeight: 720 }}
        className="!grid-cols-1 lg:!grid-cols-[1fr_1.2fr]"
      >
        {/* Text column */}
        <div
          style={{
            padding: "96px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              letterSpacing: ".45em",
              color: "#c9a961",
              textTransform: "uppercase",
            }}
          >
            NEW SEASON&nbsp;·&nbsp;2026 COLLECTION
          </div>

          <h2
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: "clamp(48px, 6vw, 80px)",
              fontWeight: 800,
              lineHeight: 0.96,
              letterSpacing: "-.025em",
              margin: "24px 0 0",
            }}
          >
            Dress the
            <br />
            whole family,
            <br />
            <em style={{ fontWeight: 700, color: "#c9a961" }}>one order.</em>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,.72)",
              marginTop: 28,
              maxWidth: 460,
              lineHeight: 1.6,
            }}
          >
            From her evening look to his Friday outfit and the kids&apos; weekend
            fits — everything in one place, delivered to your door, paid with
            M-Pesa.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 }}>
            <Link href="/products" className="es-btn-plum">SHOP THE COLLECTION →</Link>
            <Link href="/woman" className="es-btn-outline-white">WOMEN&apos;S NEW IN</Link>
          </div>
        </div>

        {/* Image triptych */}
        <div style={{ position: "relative", overflow: "hidden", minHeight: 480 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 4,
            }}
          >
            <ElitePlate kind="woman" tone="plum"  />
            <ElitePlate kind="man"   tone="smoke" />
            <ElitePlate kind="child" tone="warm"  />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 24,
              color: "#ffffff",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 10,
              letterSpacing: ".4em",
              textTransform: "uppercase",
            }}
          >
            WOMAN · MAN · CHILDREN
          </div>
        </div>
      </div>
    </section>
  );
}
