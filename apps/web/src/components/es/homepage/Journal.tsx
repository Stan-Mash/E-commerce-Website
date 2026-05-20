import Link from "next/link";
import { ElitePlate } from "@/components/es/ElitePlate";
import type { ToneKey, FigureKind } from "@/components/es/ElitePlate";

const POSTS: { n: string; tag: string; title: string; desc: string; tone: ToneKey; kind: FigureKind }[] = [
  {
    n: "01",
    tag: "STYLE NOTES",
    title: "Dressing for the boardroom you have not yet seen.",
    desc: "A four-piece capsule, in seven hours of meetings.",
    tone: "smoke",
    kind: "woman",
  },
  {
    n: "02",
    tag: "THE ATELIER",
    title: "His first suit — at six, twelve, and twenty-four.",
    desc: "Why we cut a child's blazer with grown-up rules.",
    tone: "sand",
    kind: "child",
  },
  {
    n: "03",
    tag: "HOUSE STORIES",
    title: "Two daughters, one cutting table, twenty years.",
    desc: "Inside the Westlands atelier — and the women who run it.",
    tone: "warm",
    kind: "woman",
  },
];

export function Journal() {
  return (
    <section style={{ background: "#ffffff", padding: "120px 64px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
          marginBottom: 48,
        }}
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
            JOURNAL
          </div>
          <h2
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-.025em",
              color: "#0a0a0a",
              margin: "12px 0 0",
            }}
          >
            Field notes, from the house.
          </h2>
        </div>
        <Link
          href="/journal"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 11,
            letterSpacing: ".34em",
            color: "#0a0a0a",
            borderBottom: "1px solid #0a0a0a",
            paddingBottom: 4,
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          READ THE JOURNAL →
        </Link>
      </div>

      {/* 3-col posts */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}
        className="!grid-cols-1 md:!grid-cols-3"
      >
        {POSTS.map((p) => (
          <article key={p.n}>
            <div style={{ aspectRatio: "4/5", position: "relative" }}>
              <ElitePlate kind={p.kind} tone={p.tone} />
            </div>
            <div style={{ paddingTop: 22 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "var(--font-bodoni), Georgia, serif",
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "#9b7b3f",
                    letterSpacing: ".22em",
                  }}
                >
                  № {p.n}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 10,
                    letterSpacing: ".34em",
                    color: "#717171",
                    textTransform: "uppercase",
                  }}
                >
                  {p.tag}
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-bodoni), Georgia, serif",
                  fontOpticalSizing: "auto",
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#0a0a0a",
                  marginTop: 10,
                  lineHeight: 1.15,
                  letterSpacing: "-.01em",
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 14,
                  color: "#717171",
                  marginTop: 10,
                  lineHeight: 1.6,
                }}
              >
                {p.desc}
              </p>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 10,
                  letterSpacing: ".34em",
                  color: "#0a0a0a",
                  marginTop: 16,
                  borderBottom: "1px solid #0a0a0a",
                  display: "inline-block",
                  paddingBottom: 3,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                READ THE STORY →
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
