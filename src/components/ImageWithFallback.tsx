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
  // 1. Identifica links inválidos ou nulos
  const isInvalid = !src || (typeof src === 'string' && (src.includes('agenda-nba-padrao.jpg') || src.includes('undefined') || src.length < 5));
  
  const [imgSrc, setImgSrc] = useState<any>(isInvalid ? fallbackSrc : src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isInvalid) {
        setImgSrc(fallbackSrc);
    } else {
        setImgSrc(src);
        setHasError(false);
    }
  }, [src, isInvalid, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // 2. Se for uma URL absoluta (começa com http), usamos <img> nativa.
  // Isso resolve o problema das fotos manuais (Supabase) e externas (ESPN/Yahoo) não aparecerem em produção.
  const isAbsoluteUrl = typeof src === 'string' && src.startsWith('http');

  if (isAbsoluteUrl || hasError) {
    const getDimension = (dim: any) => {
        if (typeof dim === 'number') return `${dim}px`;
        if (typeof dim === 'string' && !dim.includes('%') && !dim.includes('px')) return `${dim}px`;
        return dim;
    };

    return (
      <img
        src={imgSrc}
        alt={alt || "DuoDunk Notícias"}
        className={className}
        referrerPolicy="no-referrer"
        loading={rest.priority ? 'eager' : (rest.loading as any) || 'lazy'}
        style={{
            ...style, // Mantém o objectPosition (focal point)
            objectFit: 'cover',
            ...(fill ? {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            } : {
                width: getDimension(rest.width),
                height: getDimension(rest.height),
            })
        }}
        onError={handleError}
      />
    );
  }

  // 3. Para caminhos locais (/images/...), continua usando Next Image
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