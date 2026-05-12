import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:    "#00063d",
        flame:   "#fa4028",
        "flame-hover": "#801a10",
        "flame-light": "#fffdfc",
        bg:       "#00050f",
        surface: {
          1: "#0a0a1a",
          2: "#12121e",
          3: "#1a1a2e",
          4: "#22223a",
        },
        muted:   "#9b9b9b",
        faint:   "#5e5d5f",
      },
      fontFamily: {
        body:    ["Inter", "Arial", "sans-serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
        mono:    ["Fira Code", "Cascadia Code", "Consolas", "monospace"],
      },
      borderRadius: {
        pill: "100vw",
        md:   "1rem",
        sm:   "0.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
