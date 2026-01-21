'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function SafeImage({ src, alt, className, width = 400, height = 300 }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
