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
        midnight: "#0F172A",
        charcoal: "#1E293B",
        mist: "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans-arabic)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
