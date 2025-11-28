'use client';

import { Helmet } from 'react-helmet-async';
import { usePathname } from 'next/navigation';

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath?: string;
}

const SITE_URL = 'https://www.duodunk.com.br';

export default function PageMeta({ 
  title, 
  description, 
  canonicalPath 
}: PageMetaProps) {
  const pathname = usePathname();
  
  // Constrói a URL canônica baseada no path atual (do Next.js)
  // Se canonicalPath for fornecido, usa ele. Senão, usa o pathname atual.
  const path = canonicalPath || pathname || '';
  const canonicalUrl = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{title} | Duo Dunk</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph e Twitter */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}