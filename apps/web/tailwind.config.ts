import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Elite Style Co. — Modern Premium design system ────────────
        es: {
          // Surfaces
          white:             "#ffffff",
          paper:             "#f7f6f4",
          bone:              "#eeece8",

          // Type & UI
          ink:               "#0d0d0d",
          char:              "#1a1a1a",
          mute:              "#6b6b6b",
          faint:             "#a8a8a8",

          // Borders
          hair:              "rgba(13,13,13,0.08)",
          rule:              "rgba(13,13,13,0.12)",

          // Accent — Antique Champagne (dry, muted bronze; not gold)
          champagne:         "#b5a090",
          "champagne-lt":    "#f0ece8",
          "champagne-dk":    "#8c7262",
        },
        // ── Semantic aliases (used by existing utility classes) ────────
        ink: {
          DEFAULT: "#0d0d0d",
          soft:    "#4a4a4a",
          muted:   "#6b6b6b",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft:    "#f7f6f4",
          warm:    "#eeece8",
        },
      },
      fontFamily: {
        sans:      ["var(--font-inter)",    "system-ui",  "sans-serif"],
        display:   ["var(--font-cormorant)","Georgia",    "serif"],
        cormorant: ["var(--font-cormorant)","Georgia",    "serif"],
      },
      fontSize: {
        "10xl": ["7rem",   { lineHeight: "0.90" }],
        "9xl":  ["5rem",   { lineHeight: "0.94" }],
        "8xl":  ["4.5rem", { lineHeight: "0.98" }],
        "7xl":  ["4rem",   { lineHeight: "1.00" }],
        "6xl":  ["3.5rem", { lineHeight: "1.04" }],
      },
      letterSpacing: {
        "super":    ".45em",
        "display":  "-.03em",
        "headline": "-.025em",
        "wide":     ".18em",
        "wider":    ".26em",
        "label":    ".12em",
      },
      screens: {
        xs: "375px",
      },
      aspectRatio: {
        "product":  "3/4",
        "portrait": "4/5",
        "hero":     "2/3",
        "wide":     "5/4",
      },
      keyframes: {
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer:   "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in": "fade-in 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
