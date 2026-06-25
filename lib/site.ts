/** Canonical production URL — override via NEXT_PUBLIC_SITE_URL in Vercel/local. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://mudrik.vercel.app";

/** Public routes included in sitemap and SEO surface. */
export const PUBLIC_ROUTES = [
  "/",
  "/command-center",
  "/vault",
  "/archive",
  "/company-profile",
  "/settings",
] as const;
