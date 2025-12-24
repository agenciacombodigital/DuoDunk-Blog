"use client";

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export default function ImageWithFallback({ 
  src, 
  fallbackSrc = "https://duodunk.com.br/images/agenda-nba-padrao.jpg", 
  alt, 
  className,
  style,
  fill,
  ...rest 
}: ImageWithFallbackProps) {
  // Identifica links inválidos ou nulos
  const isInvalid = !src || (typeof src === 'string' && (src.includes('undefined') || src.length < 5));
  
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

  // Para URLs absolutas externas, usamos <img> nativa com o handler de erro solicitado
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
            ...style,
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