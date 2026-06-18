import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080b11",
        card: "#111824",
        border: "#1d2734",
        primary: "#ff7a18",
        accent: "#22d3ee",
        muted: "#8b97a7",
      },
      fontFamily: {
        mono: ["ui-monospace", "Cascadia Code", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
