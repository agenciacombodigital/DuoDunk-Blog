"use client";

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface ArticleBodyProps {
  content: string;
}

export default function ArticleBody({ content }: ArticleBodyProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    // Sanitiza apenas no navegador
    if (content) {
      // Configurações para permitir links e estilos básicos
      const cleanContent = DOMPurify.sanitize(content, {
        // Permite tags comuns de formatação e listas
        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'img', 'div', 'span', 'br', 'blockquote', 'hr'],
        // Permite atributos de link e estilo
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'src', 'alt', 'width', 'height'],
      });
      setSanitizedContent(cleanContent);
    }
  }, [content]);

  if (!sanitizedContent) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div 
      className="prose prose-lg max-w-none mb-12 font-inter text-gray-800 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}