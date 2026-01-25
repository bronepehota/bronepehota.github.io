/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // Base path only for GitHub Pages deployment in production
  basePath: isProd ? '/bronepehota' : '',
  assetPrefix: isProd ? '/bronepehota' : '',
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


