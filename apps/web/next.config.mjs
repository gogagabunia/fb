/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["database"],
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
