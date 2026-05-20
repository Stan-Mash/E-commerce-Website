/**
 * ElitePlate — editorial photo placeholder.
 * Clean gradient panels with no silhouettes.
 * Replace with <Image> or <video> when real assets arrive.
 */

export type FigureKind = "woman" | "man" | "child" | "abstract";
export type ToneKey   = "warm" | "smoke" | "plum" | "bone" | "sage" | "sand" | "ink";

interface Props {
  kind?:  FigureKind;
  tone?:  ToneKey;
  label?: string;
  className?: string;
}

/** Base + accent colours for each tone */
const TONES: Record<ToneKey, { bg: string; mid: string; accent: string; text: "light" | "dark" }> = {
  warm:  { bg: "#c9a47a", mid: "#b07a52", accent: "#8c5a35",  text: "dark"  },
  smoke: { bg: "#c4c8d0", mid: "#9ba0aa", accent: "#6b717d",  text: "dark"  },
  plum:  { bg: "#7b4d8c", mid: "#4e2460", accent: "#2a1135",  text: "light" },
  bone:  { bg: "#ede8df", mid: "#d8d0c2", accent: "#c2b8a6",  text: "dark"  },
  sage:  { bg: "#b4bfb0", mid: "#8a9885", accent: "#5f6e5a",  text: "dark"  },
  sand:  { bg: "#d4c4a8", mid: "#b8a484", accent: "#967e60",  text: "dark"  },
  ink:   { bg: "#4a4a4a", mid: "#2a2a2a", accent: "#0a0a0a",  text: "light" },
};

/** Decorative inset block per department — like a fabric swatch or folded cloth */
const SHAPES: Record<FigureKind, React.ReactNode> = {
  woman: (
    <svg viewBox="0 0 200 280" style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", width: "52%", opacity: 0.22 }} aria-hidden>
      {/* Draped fabric — flowing vertical panels */}
      <rect x="20"  y="0"   width="48" height="280" rx="24" />
      <rect x="76"  y="20"  width="48" height="240" rx="24" />
      <rect x="132" y="8"   width="48" height="260" rx="24" />
    </svg>
  ),
  man: (
    <svg viewBox="0 0 200 240" style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", width: "50%", opacity: 0.2 }} aria-hidden>
      {/* Clean suiting — geometric blocks */}
      <rect x="10"  y="0"  width="80"  height="240" rx="4" />
      <rect x="110" y="0"  width="80"  height="240" rx="4" />
      <rect x="60"  y="40" width="80"  height="160" rx="4" />
    </svg>
  ),
  child: (
    <svg viewBox="0 0 160 200" style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", width: "44%", opacity: 0.2 }} aria-hidden>
      {/* Playful rounded shapes */}
      <rect x="10"  y="60"  width="140" height="140" rx="70" />
      <rect x="40"  y="0"   width="80"  height="100" rx="40" />
    </svg>
  ),
  abstract: (
    <svg viewBox="0 0 320 260" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }} aria-hidden>
      {/* Atelier — overlapping rectangles suggesting fabric bolts */}
      <rect x="20"  y="40"  width="180" height="220" rx="2" />
      <rect x="80"  y="20"  width="180" height="220" rx="2" />
      <rect x="140" y="60"  width="160" height="180" rx="2" />
    </svg>
  ),
};

export function ElitePlate({ kind = "woman", tone = "warm", label, className }: Props) {
  const { bg, mid, accent, text } = TONES[tone];
  const textColor = text === "light" ? "rgba(255,255,255,0.7)" : "rgba(10,10,10,0.45)";
  const shapeColor = text === "light" ? "#ffffff" : "#000000";

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    >
      {/* Three-stop gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(160deg, ${bg} 0%, ${mid} 55%, ${accent} 100%)`,
      }} />

      {/* Radial highlight — upper left soft bloom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18) 0%, transparent 65%)",
      }} />

      {/* Decorative shape */}
      <div style={{ position: "absolute", inset: 0, color: shapeColor }}>
        {SHAPES[kind]}
      </div>

      {/* Bottom vignette for text legibility */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 45%)",
      }} />

      {label && (
        <div style={{
          position: "absolute", left: 22, bottom: 20,
          color: textColor,
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 10, letterSpacing: ".4em",
          textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
