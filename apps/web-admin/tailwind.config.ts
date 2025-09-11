import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // GitHub Primer-ish neutrals
        canvas: { DEFAULT: "#f6f8fa", dark: "#0d1117" },
        panel:  { DEFAULT: "#ffffff", dark: "#0d1117" },
        fg:     { DEFAULT: "#1f2328", dark: "#e6edf3" },
        muted:  { DEFAULT: "#6e7781", dark: "#7d8590" },
        border: { DEFAULT: "#d0d7de", dark: "#30363d" },
        accent: { DEFAULT: "#0969da", dark: "#2f81f7" },
        success:{ DEFAULT: "#1a7f37", dark: "#3fb950" },
        danger: { DEFAULT: "#d1242f", dark: "#f85149" },
      },
      borderRadius: {
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        subtle: "0 1px 0 rgba(31,35,40,0.04), 0 1px 3px rgba(31,35,40,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;