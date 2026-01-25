/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Base path for GitHub Pages deployment at https://luxor.github.io/bronepehota/
  basePath: '/bronepehota',
  assetPrefix: '/bronepehota',
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


