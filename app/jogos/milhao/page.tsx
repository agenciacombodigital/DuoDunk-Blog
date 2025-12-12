import MilhaoInterface from '@/components/games/MilhaoInterface';
import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Milhão NBA - O Quiz | Duo Dunk',
  description: 'Teste seu conhecimento sobre a NBA e concorra ao prêmio máximo.',
};

// Garante que a página sempre busque os dados mais recentes
export const dynamic = 'force-dynamic';

export default async function MilhaoPage() {
  // Busca as configurações (Logo, etc) no Servidor
  const { data: settings } = await supabaseServer
    .from('quiz_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const safeSettings = settings || {};

  return (
    // Removemos o 'fixed inset-0' para permitir que o Header do site apareça acima
    <div className="min-h-screen bg-zinc-950 relative flex flex-col">
      
      {/* Background estilizado (Fica apenas no fundo desta seção) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] z-0" />

      {/* Container do Jogo */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-12 px-4">
        
        {/* Passamos as configurações já carregadas para o componente */}
        <MilhaoInterface initialSettings={safeSettings} />
        
      </div>
    </div>
  );
}