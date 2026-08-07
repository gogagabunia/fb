/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["database"],
  // Playwright is only reachable through the scraper's browser fallback, which
  // cannot run on Vercel — the serverless runtime ships no browser binary and
  // the build never installs one. Next's tracer follows the dynamic import
  // anyway, so exclude it explicitly. Local dev resolves from node_modules and
  // is unaffected.
  outputFileTracingExcludes: {
    '**/*': [
      '**/node_modules/playwright/**',
      '**/node_modules/playwright-core/**',
      '**/node_modules/@playwright/**'
    ]
  },
  typescript: {
    // Type errors fail the build. This was previously ignored, which hid real
    // bugs — e.g. the marketplace filtered on `listing.isFeatured` while the
    // Listing interface had no such field.
    ignoreBuildErrors: false
  },
  eslint: {
    // No ESLint config in this workspace yet; enabling this would fail the
    // build on a missing config rather than on real lint errors.
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
