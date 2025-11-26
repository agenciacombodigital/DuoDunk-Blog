import { Helmet } from 'react-helmet-async';

interface ArticleMetaProps {
  article: {
    title: string;
    summary: string;
    image_url?: string;
    slug: string;
    tags?: string[];
    published_at: string;
    updated_at?: string;
    author?: string;
  };
}

export default function ArticleMeta({ article }: ArticleMetaProps) {
  const siteUrl = 'https://www.duodunk.com.br';
  const currentUrl = `${siteUrl}/artigos/${article.slug}`;
  const imageUrl = article.image_url || `${siteUrl}/images/duodunk-logoV2.svg`;
  
  // Lógica aprimorada para Keywords
  // Pega as tags do artigo, remove duplicatas e junta com vírgula
  const articleKeywords = article.tags && article.tags.length > 0
    ? [...new Set(article.tags)].join(', ')
    : 'NBA, Basquete, Notícias, NBA Brasil';

  const publishedTime = new Date(article.published_at).toISOString();
  const modifiedTime = article.updated_at ? new Date(article.updated_at).toISOString() : publishedTime;
  const authorName = article.author || 'Duo Dunk Redação';

  // Schema.org para NewsArticle (Google News)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [imageUrl],
    "datePublished": publishedTime,
    "dateModified": modifiedTime,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": "Duo Dunk",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/images/duodunk-logoV2.svg`
      }
    },
    "description": article.summary,
    "keywords": articleKeywords, // Adicionado ao Schema também
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    }
  };

  return (
    <Helmet>
      {/* Título e Meta Básica - Força a atualização */}
      <title>{article.title} | Duo Dunk</title>
      <meta name="description" content={article.summary} />
      <meta name="keywords" content={articleKeywords} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph (Facebook/WhatsApp) */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={article.summary} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="article:published_time" content={publishedTime} />
      <meta property="article:modified_time" content={modifiedTime} />
      <meta property="article:author" content={authorName} />
      <meta property="article:section" content="NBA" />
      
      {/* Gera uma meta tag para cada tag individualmente também */}
      {article.tags?.map(tag => (
        <meta property="article:tag" content={tag} key={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={article.summary} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Schema JSON-LD para Google News */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}