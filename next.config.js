/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Base path for GitHub Pages deployment at https://luxor.github.io/bronepehota/
  basePath: '/bronepehota',
  assetPrefix: '/bronepehota',
  // Custom image loader for GitHub Pages
  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './image-loader.ts',
  },
  eslint: {
    // Disable ESLint during builds in production
    // Run it separately with npm run lint
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;


