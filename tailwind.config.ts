import type { Config } from "tailwindcss";

// -----------------------------------------------------------------------------
//  The Emerald Atelier palette
//
//  These tokens are the single source of truth for the Mudrik color system.
//  Legacy token names (`midnight`, `charcoal`, `mist`) are intentionally kept
//  and remapped to the new emerald shades so the hundreds of existing
//  `bg-midnight` / `text-charcoal` utilities across the app migrate without
//  any JSX edits. This is purely a CSS-level palette migration — no layout,
//  dimension, or behavioral change.
// -----------------------------------------------------------------------------

const emerald = {
  // Deep emerald — dark left panels, high-authority text, logo pill.
  primary: "#003334",
  // Signature emerald — buttons, interactive accents, links on light surfaces.
  secondary: "#006a67",
  // Charcoal-teal — secondary text on light backgrounds, grounding contrast.
  tertiary: "#242e38",
  // Main light surface — replaces every pure-white container.
  surface: "#f7fafa",
  // Ghost border — secondary color at 15 % alpha, per the no-line rule.
  ghost: "rgba(0, 106, 103, 0.15)",
} as const;

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
        // --- The Emerald Atelier tokens ----------------------------------
        primary: emerald.primary,
        secondary: emerald.secondary,
        tertiary: emerald.tertiary,
        surface: emerald.surface,
        ghost: emerald.ghost,

        // --- Legacy aliases, remapped to the new palette -----------------
        // `midnight` was #0F172A → now the emerald primary.
        midnight: emerald.primary,
        // `charcoal` was #1E293B → now the emerald tertiary (body text).
        charcoal: emerald.tertiary,
        // `mist` keeps its muted slate role for nav/labels on the surface.
        mist: "#5a6b6b",
      },
      borderColor: {
        // Allows `border-ghost` as the only sanctioned sectioning border.
        ghost: emerald.ghost,
      },
      ringColor: {
        ghost: emerald.ghost,
      },
    },
  },
  plugins: [],
};

export default config;
