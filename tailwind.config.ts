import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070a12",
        card: "#121a28",
        card2: "#0d1521",
        border: "#1f2a3c",
        primary: "#ff7a18",
        primary2: "#ff9d4d",
        accent: "#22d3ee",
        muted: "#8b97a7",
      },
      fontFamily: {
        mono: ["ui-monospace", "Cascadia Code", "Consolas", "monospace"],
      },
      boxShadow: {
        soft: "0 12px 34px -22px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
};
export default config;
