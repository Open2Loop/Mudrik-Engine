/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep default output mode to avoid standalone path/chunk mismatches.
  output: undefined,
  webpack: (config) => {
    // `pdf-parse` / canvas — exclude native binding from the bundle.
    // Do not set `config.cache = false` globally: it can worsen dev HMR and
    // contribute to missing chunk id errors; use `npm run clean` if .next is stale.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
