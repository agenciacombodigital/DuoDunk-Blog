import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';
import PageMeta from '@/components/PageMeta';
import { Suspense } from 'react';

// Importando os novos componentes modulares
import FeaturedSection from '@/components/home/FeaturedSection';
import ListSection from '@/components/home/ListSection';
import NewsGridSection from '@/components/home/NewsGridSection';
import ArchiveSection from '@/components/home/ArchiveSection';
import { Article } from '@/components/home/ArticleTypes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Duo Dunk - O Jogo Dentro do Jogo",
  description: "Notícias, análises e estatísticas da NBA.",
  alternates: {
    canonical: '/',
  },
};

// Função de busca de dados no servidor (SSR)
async function loadArticles(): Promise<Article[]> {
  // Adicionando um log para rastrear a execução
  console.log('⚙️ [SSR] Tentando carregar artigos...');
  
  // A busca é simples e direta, o que é bom.
  const { data, error } = await supabaseServer
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ [SSR] Erro ao carregar artigos:', error);
    // Lançar o erro fará com que o error.tsx seja acionado, o que é o comportamento esperado.
    throw new Error(`Falha ao carregar artigos do Supabase: ${error.message}`);
  }
  
  console.log(`✅ [SSR] Carregados ${data?.length || 0} artigos.`);
  return data || [];
}

// Componente principal da Home (assíncrono)
async function HomeContent() {
  // Se loadArticles falhar, o erro será capturado pelo Error Boundary (app/error.tsx)
  const articles = await loadArticles();

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
           <h2 className="text-2xl font-oswald mb-2">Nenhum artigo publicado ainda.</h2>
           <p className="text-gray-600 font-inter">Acesse o admin para criar ou processar notícias.</p>
        </div>
      </div>
    );
  }

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  
  // Divisão dos artigos em seções
  const section1 = otherArticles.slice(0, 7); // Usado na FeaturedSection (mini-grid e sidebar)
  const section2 = otherArticles.slice(7, 13); // Não Perca (Lista)
  const section3 = otherArticles.slice(13, 15); // Análises Profundas (Grid 2)
  const section4 = otherArticles.slice(15, 19); // Destaques Rápidos (Grid 4)
  const section5 = otherArticles.slice(19, 25); // Mais Lidas (Lista Alternada)
  const section6 = otherArticles.slice(25, 28); // Mais da NBA (Grid 3)
  const section7 = otherArticles.slice(28, 34); // Não Perca 2 (Lista)
  const section8 = otherArticles.slice(34, 36); // Grid 2
  const remaining = otherArticles.slice(36); // Arquivo

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