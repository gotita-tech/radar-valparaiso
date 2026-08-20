import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0A",
          900: "#121212",
          800: "#1A1A1A",
          700: "#232323",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#D4AF37",
          muted: "#8A7127",
        },
        paper: {
          DEFAULT: "#F5F5F5",
          dim: "#D9D9D9",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        jp: ["var(--font-noto-serif-jp)", "serif"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      backgroundImage: {
        "ink-wash": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,162,39,0.10), transparent 60%)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(-2%, -1.5%, 0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        rise: "rise 0.6s ease-out forwards",
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
