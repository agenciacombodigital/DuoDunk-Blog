import MilhaoInterface, { QuizSettings } from '@/components/games/MilhaoInterface';
import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Milhão NBA - O Quiz | Duo Dunk',
  description: 'Teste seu conhecimento sobre a NBA e concorra ao prêmio máximo no quiz Milhão NBA.',
  alternates: {
    canonical: 'https://www.duodunk.com.br/jogos/milhao',
  },
};

// Adiciona revalidação para não ficar cacheado pra sempre (0 = sempre fresco)
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function MilhaoPage() {
  // 1. Busca as configurações ANTES de renderizar a página
  const { data: settings } = await supabaseServer
    .from('quiz_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle(); // Usando maybeSingle para garantir que não quebre se não houver linha

  // Garante um objeto vazio se falhar, para não quebrar
  const safeSettings: QuizSettings = settings || {};

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Background estilizado */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]" />

      <div className="relative min-h-screen py-12 px-4 flex flex-col items-center">
        {/* Passa as configurações iniciais via prop */}
        <MilhaoInterface initialSettings={safeSettings} />
      </div>
    </div>
  );
}