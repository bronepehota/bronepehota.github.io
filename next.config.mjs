import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
// Use GITHUB_PAGES environment variable to control basePath for deployment
// Set GITHUB_PAGES=true when building for GitHub Pages deployment
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// Base path for GitHub Pages deployment
// Export for use in components (e.g., PWA manifest generation)
const BASE_PATH = isGitHubPages ? '/bronepehota' : '';

export { BASE_PATH };

const nextConfig = {
  output: 'export',
  // Base path only for GitHub Pages deployment in production
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  images: {
    unoptimized: true,
  },
  eslint: {
    // Disable ESLint during builds in production
    // Run it separately with npm run lint
    ignoreDuringBuilds: false,
  },
};

export default withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Note: Serwist automatically handles basePath, so we don't need to specify swUrl/scope
})(nextConfig);


