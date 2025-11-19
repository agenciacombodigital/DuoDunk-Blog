import { Helmet } from 'react-helmet-async';

interface ArticleMetaProps {
  title: string;
  description: string;
  imageUrl: string;
  publishedAt: string;
  updatedAt?: string; // Adicionado
  author?: string;
  slug: string;
  tags?: string[];
}

// Lista de palavras-chave prioritárias para SEO
const PRIORITY_KEYWORDS = [
  "NBA hoje", "Lakers notícias", "Luka Doncic", "Classificação NBA", "Stephen Curry", 
  "LeBron James", "Victor Wembanyama", "Warriors notícias", "Celtics", "Nikola Jokic", 
  "Chicago Bull", "Shai Gilgeous Alexander", "OKC", "Oklahoma City Thunder", "Gui Santos", 
  "NBA ao vivo", "Resultado NBA", "Lakers hoje", "Onde assistir NBA", "Jayson Tatum", 
  "Giannis Antetokounmpo", "NBA Brasil", "Playoffs NBA", "Tabela NBA", "Melhores jogadas NBA", 
  "Notícias NBA em português"
];

export default function ArticleMeta({ 
  title, 
  description, 
  imageUrl, 
  publishedAt, 
  updatedAt, // Usando a nova prop
  author = "Fernando Balley", // Definindo o autor padrão
  slug,
  tags = []
}: ArticleMetaProps) {
  const siteUrl = 'https://www.duodunk.com.br';
  const articleUrl = `${siteUrl}/artigos/${slug}`;
  const defaultImageUrl = `${siteUrl}/images/duodunk-logoV2.svg`;

  let finalImageUrl = defaultImageUrl;
  if (imageUrl && imageUrl.startsWith('http')) {
    finalImageUrl = imageUrl;
  } else if (imageUrl) {
    finalImageUrl = `${siteUrl}${imageUrl}`;
  }
  
  // Combina tags do artigo com palavras-chave prioritárias, removendo duplicatas
  const allKeywords = Array.from(new Set([
    "NBA", 
    ...tags, 
    ...PRIORITY_KEYWORDS
  ])).join(', ');
  
  // Usar updatedAt se existir, senão usa publishedAt. Garantir formato ISO.
  const datePublishedISO = new Date(publishedAt).toISOString();
  const dateModifiedISO = new Date(updatedAt || publishedAt).toISOString();

  return (
    <Helmet>
      {/* SEO BÁSICO */}
      <title>{title} | Duo Dunk</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      
      {/* ✅ CANÔNICA: URL absoluta e limpa */}
      <link rel="canonical" href={articleUrl} />

      {/* OPEN GRAPH (WhatsApp, Facebook) */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Duo Dunk" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={articleUrl} />
      <meta property="og:image" content={finalImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="article:published_time" content={datePublishedISO} />
      <meta property="article:modified_time" content={dateModifiedISO} /> {/* Usando data ISO formatada */}
      <meta property="article:author" content={author} />
      {tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* TWITTER CARD */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@duodunk" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImageUrl} />

      {/* ✅ SCHEMA.ORG JSON-LD (NewsArticle para Google News) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": articleUrl
          },
          "headline": title,
          "image": [
            finalImageUrl
          ],
          "datePublished": datePublishedISO, // Usando data ISO formatada
          "dateModified": dateModifiedISO, // Usando data ISO formatada
          "author": {
            "@type": "Person",
            "name": author // Usando o nome do autor
          },
          "publisher": {
            "@type": "Organization",
            "name": "Duo Dunk",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.duodunk.com.br/images/duodunk-logoV2.svg"
            }
          }
        })}
      </script>
    </Helmet>
  );
}