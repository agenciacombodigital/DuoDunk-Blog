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
      setSanitizedContent(DOMPurify.sanitize(content));
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