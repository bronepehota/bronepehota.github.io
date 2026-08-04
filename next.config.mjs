import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
// Use NEXT_PUBLIC_GITHUB_PAGES environment variable to control basePath for deployment
// Set NEXT_PUBLIC_GITHUB_PAGES=true when building for GitHub Pages deployment
const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';

// Canonical public origin. Defaults to the Project Pages subpath
// (luxor.github.io/bronepehota) for the legacy deployment; override with
// NEXT_PUBLIC_SITE_URL for any root-served deployment — a custom domain
// (https://bronepehota.ru) OR a User/Org Pages root (https://bronepehota.github.io).
// NOTE: use || not ?? — deploy.yml renders an ABSENT secret as '' (empty string);
// ?? passes '' through → new URL('') crashes the build. || treats '' as unset.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (isGitHubPages ? 'https://luxor.github.io/bronepehota' : 'http://localhost:3000');

// basePath = the subpath the site is mounted at (SITE_URL's pathname).
// '' when served from a domain/account ROOT (custom domain, or User/Org Pages
// like bronepehota.github.io); '/bronepehota' only for the legacy Project Pages
// subpath. A single env var (NEXT_PUBLIC_SITE_URL) controls origin + mount point.
// Export for use in components (e.g., PWA manifest generation). Must match src/lib/constants.ts.
let BASE_PATH = '';
try {
  BASE_PATH = new URL(SITE_URL).pathname.replace(/\/+$/, '');
} catch {
  BASE_PATH = '';
}

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


