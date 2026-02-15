'use client';

import { useState } from 'react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';

interface SafeImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  onError?: () => void;
}

export default function SafeImage({ src, alt, className, width = 300, height = 400, fill = false, onError }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (!src || hasError) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      onError={handleError}
      unoptimized
    />
  );
}
