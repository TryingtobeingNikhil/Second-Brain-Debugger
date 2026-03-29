import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        accent: "var(--accent)",
        conflict: "var(--conflict)",
        clarity: "var(--clarity)",
        text: "var(--text)",
        muted: "var(--muted)",
      },
      dropShadow: {
        glow: "var(--glow)",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
        sans: ['"Inter"', "sans-serif"],
        display: ['"Space Grotesk"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
