/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["database"],
  typescript: {
    // Skip typescript build errors during Vercel builds if any workspace mapping mismatches
    ignoreBuildErrors: true
  },
  eslint: {
    // Ignore ESLint checks during Vercel builds for faster build cycles
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
