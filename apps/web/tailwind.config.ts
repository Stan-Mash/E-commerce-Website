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
        brand: {
          50: "#fdf8f0",
          100: "#f9edda",
          200: "#f2d9b0",
          300: "#e8bf7e",
          400: "#dca04c",
          500: "#c8832a",  // Nairobi gold
          600: "#a66520",
          700: "#854e1c",
          800: "#6b3e1c",
          900: "#59341b",
          950: "#30190b",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#4a4a4a",
          muted: "#8a8a8a",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f9f7f4",
          warm: "#f2ede6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      screens: {
        xs: "375px",
      },
      aspectRatio: {
        product: "3/4",
        video: "9/16",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
