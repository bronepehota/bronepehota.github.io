/**
 * Custom image loader for GitHub Pages deployment
 * Adds basePath to all image paths automatically
 */
export default function imageLoader({ src, width, quality }: {
  src: string;
  width: number;
  quality?: number;
}) {
  // For GitHub Pages deployment at /bronepehota/
  const basePath = '/bronepehota';

  // If src already includes basePath, return as is
  if (src.startsWith(basePath)) {
    return src;
  }

  // If src is a relative path or external URL, return as is
  if (!src.startsWith('/')) {
    return src;
  }

  // Add basePath to internal paths
  return `${basePath}${src}`;
}
