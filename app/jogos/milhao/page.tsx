import MilhaoInterface from '@/components/games/MilhaoInterface';
import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Milhão NBA - O Quiz | Duo Dunk',
  description: 'O Quiz mais difícil do Brasil.',
};

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
    // TRUQUE CSS: 'w-screen' e 'margin-left/right: -50vw' forçam o elemento a esticar 
    // até a borda da janela, mesmo se o pai tiver padding.
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] min-h-[calc(100vh-80px)] bg-zinc-950 flex flex-col overflow-hidden">
      
      {/* Background Full Screen */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] z-0" />

      {/* Conteúdo Centralizado */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-8">
        <MilhaoInterface initialSettings={safeSettings} />
      </div>
    </div>
  );
}