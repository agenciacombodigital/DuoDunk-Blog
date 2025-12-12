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
    // 'w-full' e 'min-h-screen' garantem que o fundo cubra tudo
    <div className="min-h-screen w-full bg-zinc-950 relative flex flex-col">
      
      {/* Background estilizado cobrindo 100% */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] z-0" />

      {/* Container de conteúdo com Z-Index para ficar acima do fundo */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        <MilhaoInterface initialSettings={safeSettings} />
      </div>
    </div>
  );
}