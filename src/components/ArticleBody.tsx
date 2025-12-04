"use client";

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface ArticleBodyProps {
  content: string;
  summary?: string | null; // Novo: Recebe o resumo
}

// Helper para limpar e normalizar strings para comparação
const normalizeText = (text: string) => {
  return text.replace(/<[^>]*>/g, '').trim().toLowerCase();
};

export default function ArticleBody({ content, summary }: ArticleBodyProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    if (content) {
      let finalContent = content;
      
      // 1. Tenta remover o primeiro parágrafo se houver summary
      if (summary && summary.trim()) {
        // Usa um parser temporário para encontrar o primeiro parágrafo
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const firstParagraph = doc.querySelector('p');
        
        if (firstParagraph) {
          const firstParagraphText = normalizeText(firstParagraph.innerHTML);
          const summaryText = normalizeText(summary);
          
          // Compara se o primeiro parágrafo é essencialmente o mesmo que o summary
          // Usamos uma tolerância de 90% de similaridade para evitar falsos positivos
          if (firstParagraphText.includes(summaryText) || summaryText.includes(firstParagraphText)) {
            // Remove o primeiro parágrafo do HTML original
            const firstPOuterHTML = firstParagraph.outerHTML;
            finalContent = content.replace(firstPOuterHTML, '').trim();
            
            // Se o primeiro parágrafo removido deixar um <br> ou espaço no início, limpa
            finalContent = finalContent.replace(/^(<br\s*\/?>|\s*)/i, '');
          }
        }
      }

      // 2. Sanitiza o conteúdo final
      const cleanContent = DOMPurify.sanitize(finalContent, {
        // Permite tags comuns de formatação e listas
        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'img', 'div', 'span', 'br', 'blockquote', 'hr'],
        // Permite atributos de link e estilo
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'src', 'alt', 'width', 'height'],
      });
      setSanitizedContent(cleanContent);
    }
  }, [content, summary]);

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