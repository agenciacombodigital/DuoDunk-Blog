import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import { TrendingUp, Calendar, Clock, Star } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Metadata } from 'next';
import AmazonCTA from '@/components/AmazonCTA';
import { Suspense } from 'react';
import PageMeta from '@/components/PageMeta';
import { Article } from '@/components/home/ArticleTypes';
import FeaturedSection from '@/components/home/FeaturedSection';
import ListSection from '@/components/home/ListSection';
import NewsGridSection from '@/components/home/NewsGridSection';
import ArchiveSection from '@/components/home/ArchiveSection';


// ✅ Forçar renderização dinâmica (SSR) para sempre ter notícias frescas
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Função auxiliar para tempo
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours < 1) return 'menos de 1h';
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return diffInDays === 1 ? '1 dia' : `${diffInDays} dias`;
}

// Busca de dados no servidor
async function loadArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabaseServer
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao carregar artigos:', error);
      // Lançar o erro fará com que o error.tsx seja acionado
      throw new Error(`Falha ao carregar artigos do Supabase: ${error.message}`);
    }
    return data || [];
  } catch (error) {
    console.error('Erro fatal ao buscar artigos:', error);
    throw error; // Re-lança para ser pego pelo Error Boundary
  }
}

export const metadata: Metadata = {
  title: 'Duo Dunk - O Jogo Dentro do Jogo | Notícias sobre o mundo da NBA',
  description: 'DuoDunk é o seu portal de notícias quentes sobre NBA.',
  alternates: {
    canonical: '/',
  },
};

// Componente principal da Home (assíncrono)
async function HomeContent() {
  const articles = await loadArticles();

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-oswald">Nenhum artigo publicado ainda.</h2>
        <p className="text-gray-500">Acesse o admin para criar ou processar notícias.</p>
      </div>
    );
  }

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  
  // Divisão dos artigos em seções (usando a lógica modular anterior)
  const section1 = otherArticles.slice(0, 7); 
  const section2 = otherArticles.slice(7, 13); 
  const section3 = otherArticles.slice(13, 15); 
  const section4 = otherArticles.slice(15, 19); 
  const section5 = otherArticles.slice(19, 25); 
  const section6 = otherArticles.slice(25, 28); 
  const section7 = otherArticles.slice(28, 34); 
  const section8 = otherArticles.slice(34, 36); 
  const remaining = otherArticles.slice(36); 

  return (
    <>
      <PageMeta 
        title={metadata.title as string} 
        description={metadata.description as string}
        canonicalPath={metadata.alternates?.canonical as string}
      />
      
      <div className="min-h-screen bg-white text-gray-900">
        {/* Featured Section */}
        {featuredArticle && (
          <FeaturedSection featuredArticle={featuredArticle} section1={section1} />
        )}

        {/* Seções Restantes */}
        <div className="container mx-auto px-4 space-y-16">
          
          {/* Seção 2: Não Perca (Lista) */}
          <ListSection 
            title="Não Perca" 
            articles={section2} 
            icon="pin" 
            isBoxed={true}
          />

          {/* Seção 3: Análises Profundas (Grid 2) */}
          <NewsGridSection 
            title="Análises Profundas" 
            articles={section3} 
            icon="fire" 
            gridCols={2} 
            aspectRatio="16/9" 
            titleSize="lg"
            showSummary={true}
          />

          {/* Seção 4: Destaques Rápidos (Grid 4) */}
          <NewsGridSection 
            title="Destaques Rápidos" 
            articles={section4} 
            icon="zap" 
            gridCols={4} 
            aspectRatio="4/3" 
            titleSize="sm"
          />

          {/* Seção 5: Mais Lidas (Lista Alternada) */}
          <ListSection 
            title="Mais Lidas" 
            articles={section5} 
            icon="chart" 
            isAlternating={true}
          />

          {/* Seção 6: Mais da NBA (Grid 3) */}
          <NewsGridSection 
            title="Mais da NBA" 
            articles={section6} 
            icon="ball" 
            gridCols={3} 
            aspectRatio="4/3" 
            titleSize="md"
            showSummary={true}
          />

          {/* Seção 7: Não Perca (Lista Boxed) */}
          <ListSection 
            title="Não Perca" 
            articles={section7} 
            icon="pin" 
            isBoxed={true}
          />

          {/* Seção 8: Grid 2 */}
          <NewsGridSection 
            articles={section8} 
            gridCols={2} 
            aspectRatio="16/9" 
            titleSize="md"
            showSummary={true}
          />

          {/* Seção ARQUIVO */}
          <ArchiveSection articles={remaining} />
        </div>

        <div className="h-20" />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600 py-20">Carregando destaques...</div>}>
      <HomeContent />
    </Suspense>
  );
}