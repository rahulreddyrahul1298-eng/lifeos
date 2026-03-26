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
        primary: "#6366F1",
        "primary-light": "#EEF2FF",
        secondary: "#22C55E",
        "secondary-light": "#F0FDF4",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        "border-light": "#F1F5F9",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
        "text-muted": "#94A3B8",
        danger: "#EF4444",
        "danger-light": "#FEF2F2",
        warning: "#F59E0B",
        "warning-light": "#FFFBEB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        soft: "0 2px 8px rgba(99,102,241,0.08)",
        float: "0 8px 30px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
