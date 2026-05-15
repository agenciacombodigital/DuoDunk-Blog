import { supabaseServer } from '@/integrations/supabase/server';
import { Newspaper } from 'lucide-react';
import AmazonCTA from '@/components/AmazonCTA';
import { Metadata } from 'next';

// Importação dos componentes de seção da Home
import FeaturedSection from '@/components/home/FeaturedSection';
import NewsGridSection from '@/components/home/NewsGridSection';
import ListSection from '@/components/home/ListSection';
import ArchiveSection from '@/components/home/ArchiveSection';
import { Article } from '@/components/home/ArticleTypes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'DuoDunk | O Melhor Portal de NBA do Brasil',
  description: 'Notícias, estatísticas, rumores e o Quiz do Milhão. Acompanhe tudo sobre a NBA em tempo real.',
};

async function loadArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabaseServer
      .from('articles')
      .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, image_focal_point, is_featured')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('[Home] Erro ao buscar artigos:', error.message);
      return [];
    }
    return (data || []) as Article[];
  } catch (e: any) {
    console.error('[Home] Exceção no fetch:', e.message);
    return [];
  }
}

export default async function Home() {
  const articles = await loadArticles();

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-20">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 uppercase">Nenhuma notícia encontrada</h2>
          <p className="text-gray-500 mt-2">O banco de dados parece estar vazio no momento.</p>
        </div>
      </div>
    );
  }

  // Distribuição dos artigos pelas seções
  const featuredArticle = articles.find(a => a.is_featured) || articles[0];
  const otherArticles = articles.filter(a => a.id !== featuredArticle.id);
  
  // Slices para cada seção (ajustado para preencher a página)
  const section1 = otherArticles.slice(0, 7); // Usados no FeaturedSection (sidebar e mini-grid)
  const gridArticles = otherArticles.slice(7, 13); // 6 artigos no grid
  const listArticles = otherArticles.slice(13, 18); // 5 artigos na lista lateral/alternada
  const archiveArticles = otherArticles.slice(18); // O restante vai para o arquivo visual

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. Seção de Destaque Principal */}
      <FeaturedSection 
        featuredArticle={featuredArticle} 
        section1={section1} 
      />

      <div className="container mx-auto px-4">
        {/* CTA Amazon no meio do fluxo */}
        <div className="my-12">
          <AmazonCTA />
        </div>

        {/* 2. Grid de Notícias Recentes */}
        <div className="my-16">
          <NewsGridSection 
            title="Últimas da Liga" 
            articles={gridArticles} 
            icon="zap" 
            gridCols={3} 
            aspectRatio="16/9" 
            titleSize="md"
            showSummary={true}
          />
        </div>

        {/* 3. Seção de Lista (Giro NBA) */}
        <div className="my-16">
          <ListSection 
            title="Giro NBA" 
            articles={listArticles} 
            icon="ball" 
            isAlternating={true}
            isBoxed={true}
          />
        </div>

        {/* 4. Arquivo Visual (Layout variado) */}
        <div className="my-16">
          <ArchiveSection articles={archiveArticles} />
        </div>
      </div>
    </div>
  );
}