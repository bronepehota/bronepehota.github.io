import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

/**
 * robots.txt — emitted at /robots.txt (under basePath on GitHub Pages).
 * Note: on a *.github.io/bronepehota subpath, crawlers only honor robots.txt
 * at the domain ROOT, so this becomes effective once a custom domain is added.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
