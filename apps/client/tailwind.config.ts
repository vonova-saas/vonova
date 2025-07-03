import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enables dark mode via class
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "grid": {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
        "background-shine": {
          "from": { "backgroundPosition": "0 0" },
          "to": { "backgroundPosition": "-200% 0" }
        },
        "marquee": {
          "from": { transform: "translateX(0)" },
          "to": { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "ripple": {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)", },
          "50%": { transform: "translate(-50%, -50%) scale(0.9)", },
        },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)", },
          "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)", },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "grid": "grid 15s linear infinite",
        "background-shine": "background-shine 2s linear infinite",
        "marquee": "marquee var(--duration) linear infinite",
        "ripple": "ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
      },
    },
  },
  plugins: [],
};

export default config;
