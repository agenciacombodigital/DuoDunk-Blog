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
  className,
  style,
  fill,
  ...rest 
}: ImageWithFallbackProps) {
  // Fallback imediato para o link quebrado conhecido
  const isLegacyBrokenLink = typeof src === 'string' && src.includes('agenda-nba-padrao.jpg');
  
  const [imgSrc, setImgSrc] = useState<any>(isLegacyBrokenLink ? fallbackSrc : src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isLegacyBrokenLink) {
        setImgSrc(fallbackSrc);
    } else {
        setImgSrc(src);
        setHasError(false);
    }
  }, [src, isLegacyBrokenLink, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // Se for uma imagem externa de portal (ESPN, Yahoo, CBS), usamos img nativa
  // para evitar bloqueios do otimizador do Next.js (403 Forbidden)
  const isExternalPortal = typeof src === 'string' && 
    (src.includes('espn') || src.includes('yahoo') || src.includes('cbs') || src.includes('nba.com'));

  if (isExternalPortal || hasError) {
    // Garante que width e height tenham unidade 'px' se forem números
    const getDimension = (dim: any) => {
        if (typeof dim === 'number') return `${dim}px`;
        return dim;
    };

    return (
      <img
        src={imgSrc}
        alt={alt || "DuoDunk Notícias"}
        className={className}
        loading={rest.priority ? 'eager' : (rest.loading as any) || 'lazy'}
        style={{
            top: 0,
            left: 0,
            ...style,
            objectFit: 'cover',
            width: fill ? '100%' : getDimension(rest.width),
            height: fill ? '100%' : getDimension(rest.height),
            position: fill ? 'absolute' : 'relative',
        }}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      {...rest}
      src={imgSrc || fallbackSrc}
      alt={alt || "DuoDunk Notícias"}
      fill={fill}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}