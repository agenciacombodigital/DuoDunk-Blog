import UltimasContent from '@/components/UltimasContent';
import { Metadata } from 'next';
import { Suspense } from 'react';
import PageMeta from '@/components/PageMeta';

// ✅ Configurações de Servidor (Agora funcionam!)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Últimas Notícias | Duo Dunk',
  description: 'Acompanhe as últimas notícias da NBA em tempo real, análises táticas, estatísticas ao vivo e desafie seus amigos no Quiz Milhão NBA. O melhor do basquete está aqui!',
  alternates: {
    canonical: '/ultimas',
  },
};

export default function UltimasPage() {
  return (
    <>
      <PageMeta 
        title={metadata.title as string} 
        description={metadata.description as string}
        canonicalPath={metadata.alternates?.canonical as string}
      />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600 py-20">Carregando notícias...</div>}>
        <UltimasContent />
      </Suspense>
    </>
  );
}