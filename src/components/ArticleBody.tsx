"use client";

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface ArticleBodyProps {
  content: string;
}

export default function ArticleBody({ content }: ArticleBodyProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    // Sanitiza apenas no cliente (navegador)
    setSanitizedContent(DOMPurify.sanitize(content));
  }, [content]);

  // Renderiza um esqueleto ou vazio enquanto sanitiza para evitar hidratação incorreta
  if (!sanitizedContent) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>;
  }

  return (
    <div 
      className="prose prose-lg max-w-none mb-12 font-inter"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}