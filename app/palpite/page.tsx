import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';
import { BrainCircuit, Clock } from 'lucide-react';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Palpiteiro NBA | Inteligência Artificial DuoDunk',
  description: 'Previsões de alta precisão baseadas em estatísticas da temporada 2025-26.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PalpitePage() {
  const { data: games } = await supabaseServer
    .from('daily_games')
    .select(`*, predictions(*)`)
    .order('date', { ascending: false }) 
    .limit(20); 

  const sortedGames = games?.filter(g => g.predictions?.length > 0) || [];

  if (sortedGames.length === 0) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <div className="text-center animate-pulse">
                <h2 className="text-2xl font-bold font-oswald uppercase tracking-widest">Carregando Inteligência...</h2>
                <p className="text-gray-500 font-inter">Aguardando a definição dos confrontos da rodada.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-600 selection:text-white pb-20 font-inter">
      
      {/* Luzes de Fundo (Glow) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-pink-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16">
        
        {/* Header Section (Limpado) */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-700 font-oswald uppercase">
            PALPITEIRO
          </h1>
          
          <p className="text-zinc-400 max-w-2xl text-lg font-light leading-relaxed">
            Cruzamos dados históricos, lesões e estatísticas da temporada <span className="text-white font-medium">2025-26</span> para encontrar valor onde ninguém vê.
          </p>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedGames.map((game) => {
            const palpite = game.predictions[0];
            const isHighConfidence = palpite.confidence_score >= 80;
            
            const borderColor = isHighConfidence ? 'border-emerald-500/30' : 'border-white/10';
            const accentColor = isHighConfidence ? 'text-emerald-400' : 'text-blue-400';
            const barColor = isHighConfidence ? 'bg-emerald-500' : 'bg-blue-500';

            return (
              <div key={game.id} className={`group relative flex flex-col bg-zinc-950/50 backdrop-blur-sm rounded-[2.5rem] border ${borderColor} overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:bg-zinc-900/50`}>
                
                {/* Header do Card com LOGOS */}
                <div className="px-8 py-8 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex justify-between items-center text-sm font-bold tracking-wide text-zinc-300">
                    
                    {/* Time Casa */}
                    <div className="flex flex-col items-center gap-2 w-1/3">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">CASA</span>
                        {game.home_team_logo && (
                           <div className="w-12 h-12 relative mb-1">
                             <Image src={game.home_team_logo} alt={game.home_team_name} fill className="object-contain" />
                           </div>
                        )}
                        <span className="text-white font-oswald uppercase text-base text-center leading-tight">{game.home_team_name}</span>
                    </div>

                    <span className="text-zinc-800 font-oswald text-2xl italic">VS</span>

                    {/* Time Fora */}
                    <div className="flex flex-col items-center gap-2 w-1/3">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">FORA</span>
                        {game.visitor_team_logo && (
                           <div className="w-12 h-12 relative mb-1">
                             <Image src={game.visitor_team_logo} alt={game.visitor_team_name} fill className="object-contain" />
                           </div>
                        )}
                        <span className="text-white font-oswald uppercase text-base text-center leading-tight">{game.visitor_team_name}</span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 block mb-3">Sugestão da IA</span>
                    <h3 className="text-3xl font-oswald font-bold text-white leading-none group-hover:text-pink-500 transition-colors">
                      {palpite.prediction_title}
                    </h3>
                  </div>

                  <div className="relative p-6 rounded-3xl bg-zinc-900/50 border border-white/5 mb-8 flex-1">
                      <p className="text-sm text-zinc-300 font-inter leading-relaxed italic relative z-10">
                          "{palpite.prediction_analysis}"
                      </p>
                  </div>

                  {/* Barra de Confiança */}
                  <div>
                    <div className="flex justify-between items-end mb-3 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-500">Nível de Confiança</span>
                        <span className={accentColor}>{palpite.confidence_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden p-[1px]">
                        <div 
                            className={`h-full ${barColor} rounded-full transition-all duration-1000`} 
                            style={{ width: `${palpite.confidence_score}%` }} 
                        />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-black/60 border-t border-white/5 flex justify-between items-center text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                   <div className="flex items-center gap-2">
                     <BrainCircuit size={12} className="text-pink-500" />
                     IA DUODUNK
                   </div>
                   <div className="flex items-center gap-1">
                     <Clock size={10} />
                     {new Date(game.date).toLocaleDateString('pt-BR')}
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center border-t border-white/5 pt-12">
            <p className="text-zinc-600 text-[10px] max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-bold">
                * As previsões são geradas automaticamente por modelos estatísticos. Apostas envolvem risco financeiro. Jogue com responsabilidade.
            </p>
        </div>
      </div>
    </div>
  );
}