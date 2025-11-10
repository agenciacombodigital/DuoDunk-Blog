import { Helmet } from 'react-helmet-async';

interface ArticleMetaProps {
  title: string;
  description: string;
  imageUrl: string;
  publishedAt: string;
  author?: string;
  slug: string;
  tags?: string[];
}

export default function ArticleMeta({ 
  title, 
  description, 
  imageUrl, 
  publishedAt, 
  author = "Duo Dunk",
  slug,
  tags = []
}: ArticleMetaProps) {
  const articleUrl = `https://www.duodunk.com.br/artigos/${slug}`;
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.duodunk.com.br${imageUrl}`;

  return (
    <Helmet>
      {/* SEO BÁSICO */}
      <title>{title} | Duo Dunk</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`NBA, ${tags.join(', ')}, ${title}`} />
      <link rel="canonical" href={articleUrl} />

      {/* OPEN GRAPH (WhatsApp, Facebook) */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Duo Dunk" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={articleUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="article:published_time" content={publishedAt} />
      <meta property="article:author" content={author} />
      {tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* TWITTER CARD */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@duodunk" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* SCHEMA.ORG JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": title,
          "description": description,
          "image": fullImageUrl,
          "datePublished": publishedAt,
          "author": {
            "@type": "Organization",
            "name": author
          },
          "publisher": {
            "@type": "Organization",
            "name": "Duo Dunk",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.duodunk.com.br/images/duodunk-logoV2.svg"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": articleUrl
          }
        })}
      </script>
    </Helmet>
  );
}