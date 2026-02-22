'use client';

import { forwardRef } from 'react';
import { BASE_PATH } from '@/lib/constants';

interface GitHubPagesImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  width?: number;
  height?: number;
  fill?: boolean;
  unoptimized?: boolean;
}

/**
 * Image wrapper for GitHub Pages deployment.
 * Automatically adds basePath to image paths.
 * Uses regular img tag instead of next/image for reliable static export.
 *
 * Usage: <GitHubPagesImage src="/images/file.jpg" width={400} height={300} ... />
 *        <GitHubPagesImage src="/images/file.jpg" fill ... />
 */
export const GitHubPagesImage = forwardRef<HTMLImageElement, GitHubPagesImageProps>(
  ({ src, width, height, fill, className, style, alt, unoptimized: _unoptimized, ...props }, ref) => {
    // Add basePath to internal image paths
    const finalSrc = typeof src === 'string' && src.startsWith('/images/')
      ? `${BASE_PATH}${src}`
      : src;

    // For fill: true, use absolute positioning styles
    const imgStyle: React.CSSProperties = fill
      ? { position: 'absolute', height: '100%', width: '100%', top: '0', left: '0', right: '0', bottom: '0', ...(style || {}) }
      : (style || {});

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={finalSrc}
        alt={alt || ''}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        style={imgStyle}
        {...props}
      />
    );
  }
);

GitHubPagesImage.displayName = 'GitHubPagesImage';
