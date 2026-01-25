/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    // Disable ESLint during builds in production
    // Run it separately with npm run lint
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;


