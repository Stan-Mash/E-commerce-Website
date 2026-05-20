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
        // ── Elite Style Co. design system ─────────────────────────────
        es: {
          white:   "#ffffff",
          paper:   "#f6f5f2",
          bone:    "#ecebe6",
          ink:     "#0a0a0a",
          char:    "#171717",
          mute:    "#717171",
          faint:   "#a8a8a8",
          hair:    "rgba(10,10,10,0.10)",
          plum:    "#3d1a4a",
          "plum-dk": "#2a1135",
          "plum-lt": "#f1e9f5",
          gold:    "#c9a961",
          "gold-dk": "#9b7b3f",
        },
        // ── Legacy brand tokens (keep for existing components) ─────────
        brand: {
          50:  "#fdf8f0",
          100: "#f9edda",
          200: "#f2d9b0",
          300: "#e8bf7e",
          400: "#dca04c",
          500: "#c8832a",
          600: "#a66520",
          700: "#854e1c",
          800: "#6b3e1c",
          900: "#59341b",
          950: "#30190b",
        },
        ink: {
          DEFAULT: "#0a0a0a",
          soft:    "#4a4a4a",
          muted:   "#717171",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft:    "#f6f5f2",
          warm:    "#ecebe6",
        },
      },
      fontFamily: {
        sans:      ["var(--font-inter)", "Urbanist", "Century Gothic", "AppleGothic", "sans-serif"],
        display:   ["var(--font-bodoni)", "var(--font-cormorant)", "Georgia", "serif"],
        bodoni:    ["var(--font-bodoni)", "Georgia", "serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        "10xl": ["7rem", { lineHeight: "0.92" }],   // 112px
        "9xl":  ["5rem", { lineHeight: "0.96" }],   // 80px
        "8xl":  ["4.5rem", { lineHeight: "1" }],    // 72px
        "7xl":  ["4rem", { lineHeight: "1" }],      // 64px
        "6xl":  ["3.5rem", { lineHeight: "1.05" }], // 56px
      },
      letterSpacing: {
        "super":    ".45em",
        "display":  "-.03em",
        "headline": "-.025em",
        "wide":     ".34em",
        "wider":    ".42em",
      },
      screens: {
        xs: "375px",
      },
      aspectRatio: {
        "product": "3/4",
        "portrait": "4/5",
        "video":   "9/16",
        "wide":    "5/4",
      },
      keyframes: {
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer:  "shimmer 1.5s infinite",
        "fade-up": "fade-up 0.6s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
