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
      colors: {
        background: "#0A0A0A",
        card: "#1A1A1A",
        "card-hover": "#222222",
        gold: "#C5A572",
        "gold-light": "#D4B98A",
        "gold-dark": "#A88B5C",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A1A1A1",
        "text-muted": "#6B6B6B",
        border: "#2A2A2A",
        "border-light": "#3A3A3A",
        success: "#22C55E",
        warning: "#EAB308",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["14px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.5" }],
        "2xl": ["24px", { lineHeight: "1.3" }],
        "3xl": ["28px", { lineHeight: "1.3" }],
      },
      minHeight: {
        button: "44px",
      },
    },
  },
  plugins: [],
};
export default config;
