import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        comico: ["var(--font-comico)", "sans-serif"],
      },
      colors: {
        smakr: {
          orange: "#e84a27",      // Primary Burnt Paprika
          hover: "#d23e1d",       // Accent hover state
          orangeLight: "#FF5416", // Seville Orange
          oat: "#F7F2E8",         // Cream/Linen
          espresso: "#2B1810",    // Espresso Roast
        },
        background: "#0b0f19",
        surface: "#131b2e",
        "surface-raised": "#1e293b",
        "surface-border": "#334155",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
        vibe: {
          optimal: "#10b981", // Emerald Green
          moderate: "#f59e0b", // Amber Yellow
          packed: "#ef4444", // Crimson Red
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 4s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
