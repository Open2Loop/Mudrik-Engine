/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep default output mode to avoid standalone path/chunk mismatches.
  output: undefined,
  webpack: (config) => {
    // Force a clean rebuild behavior to avoid stale chunk/cache loops.
    config.cache = false;
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
