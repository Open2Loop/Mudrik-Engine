import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-ibm-plex)", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
    },
    extend: {
      colors: {
        midnight: "#0F172A",
        charcoal: "#1E293B",
        mist: "#64748B",
      },
    },
  },
  plugins: [],
};

export default config;
