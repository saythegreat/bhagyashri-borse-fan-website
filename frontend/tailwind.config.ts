import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          950: "#14090E",
          900: "#220914",
          800: "#3A1023", // Primary deep burgundy
          700: "#4D142E",
          600: "#5A1733", // Wine red
          500: "#752245",
          400: "#92315A",
        },
        rose: {
          300: "#F2CAD3",
          400: "#E9A8B7", // Rose pink
          500: "#DC8196",
        },
        gold: {
          300: "#E8D3A8",
          400: "#D8B779", // Champagne gold
          500: "#C79D55",
          600: "#A87F3B",
        },
        ivory: {
          DEFAULT: "#FFF8F0", // Warm ivory
          50: "#FFFCF9",
          100: "#FFF8F0",
          200: "#FCEEE2",
        },
        blush: {
          DEFAULT: "#F7E5E8", // Soft blush
          50: "#FAF0F2",
          100: "#F7E5E8",
          200: "#EED0D6",
        },
        cinema: {
          dark: "#14090E",
          card: "rgba(38, 24, 32, 0.75)",
          border: "rgba(216, 183, 121, 0.2)",
          text: "#261820",
          subtle: "#6D5360",
        },
      },
      fontFamily: {
        serif: ["Cinzel", "Playfair Display", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        signature: ["Great Vibes", "cursive", "serif"],
      },
      boxShadow: {
        cinematic: "0 20px 50px rgba(20, 9, 14, 0.6)",
        gold: "0 4px 25px rgba(216, 183, 121, 0.25)",
        card: "0 10px 30px -10px rgba(58, 16, 35, 0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cinema-vignette": "radial-gradient(circle at center, transparent 40%, rgba(20, 9, 14, 0.85) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
