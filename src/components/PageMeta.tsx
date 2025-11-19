import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  
  // Constrói a URL canônica baseada no path atual, ignorando query params
  const canonicalUrl = `${SITE_URL}${canonicalPath || location.pathname}`;

  return (
    <Helmet>
      <title>{title} | Duo Dunk</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph e Twitter (usando as tags padrão do index.html como fallback) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}