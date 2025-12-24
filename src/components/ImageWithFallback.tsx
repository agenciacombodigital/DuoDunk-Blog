"use client";

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export default function ImageWithFallback({ 
  src, 
  fallbackSrc = "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop", 
  alt, 
  ...rest 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Resetar erro se o src mudar
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <Image
      {...rest}
      src={imgSrc || fallbackSrc}
      alt={alt || "DuoDunk Notícias"}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
      // Se a imagem for externa e puder ser bloqueada, unoptimized ajuda a evitar o proxy do Next.js
      unoptimized={typeof src === 'string' && (src.includes('espn') || src.includes('yahoo') || src.includes('cbs'))}
    />
  );
}