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
        surface: "#0b0b14",
        "surface-raised": "#11111e",
        "text-primary": "#f7f7fa",
        "text-secondary": "#a7a7b5",
        "brand-blue": "#4f63ff",
        "brand-violet": "#7c3aed",
        "brand-purple": "#a855f7",
        "brand-pink": "#ec4899",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
