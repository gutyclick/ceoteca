import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/config/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#05050a",
        "background-soft": "#080811",
        surface: "#0b0b14",
        "surface-raised": "#11111e",
        "surface-hover": "#171727",
        "text-primary": "#f7f7fa",
        "text-secondary": "#a7a7b5",
        "text-muted": "#737386",
        "text-inverse": "#09090f",
        "brand-blue": "#4f63ff",
        "brand-violet": "#7c3aed",
        "brand-purple": "#a855f7",
        "brand-pink": "#ec4899",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#38bdf8",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #4f63ff 0%, #8b5cf6 50%, #ec4899 100%)",
        "surface-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        "glow-violet":
          "radial-gradient(circle, rgba(124, 58, 237, 0.3), transparent 70%)",
        "glow-pink":
          "radial-gradient(circle, rgba(236, 72, 153, 0.22), transparent 70%)",
      },
      boxShadow: {
        ambient:
          "0 24px 80px rgba(0,0,0,0.45), 0 0 60px rgba(124,58,237,0.14)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        button: "0.875rem",
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
