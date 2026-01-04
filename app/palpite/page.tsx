import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';
import { BrainCircuit, Zap, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIGURAÇÃO SEO & SOCIAL ---
export const metadata: Metadata = {
  title: 'Palpite do Dia NBA | IA DuoDunk',
  description: 'Confira os palpites gerados por Inteligência Artificial para os jogos de hoje da NBA. Análises baseadas em estatísticas e histórico recente.',
  openGraph: {
    title: '🔮 Palpite do Dia NBA - DuoDunk',
    description: 'A IA analisou os jogos de hoje. Veja quem tem a maior probabilidade de vitória!',
    url: 'https://www.duodunk.com.br/palpite',
    siteName: 'DuoDunk',
    images: [
      {
        url: 'https://www.duodunk.com.br/images/banner-duodunkv2.jpg', 
        width: 1200,
        height: 630,
        alt: 'Palpiteiro DuoDunk NBA',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🔮 Palpite do Dia NBA - DuoDunk',
    description: 'Veja as previsões da nossa IA para a rodada da NBA.',
    images: ['https://www.duodunk.com.br/images/banner-duodunkv2.jpg'],
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PalpitePage() {
  try {
    // Busca os jogos e palpites relacionados
    // ✅ CORREÇÃO: Query mais segura e simplificada
    const { data: games, error } = await supabaseServer
      .from('daily_games')
      .select(`
        id,
        home_team_name,
        visitor_team_name,
        date,
        predictions (
          prediction_title,
          prediction_analysis,
          confidence_score
        )
      `)
      .order('date', { ascending: false })
      .limit(15);

    if (error) throw error;

    if (!games || games.length === 0) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
          <div className="text-center">
              <BrainCircuit className="w-20 h-20 text-[#FA007D] mx-auto mb-6 animate-pulse" />
              <h1 className="text-3xl font-oswald font-bold text-gray-900 uppercase tracking-tighter">A IA está aquecendo... 🤖🏀</h1>
              <p className="text-gray-600 mt-3 font-inter max-w-md mx-auto">Nenhum palpite gerado para hoje ainda. O robô DuoDunk analisa os jogos algumas horas antes do início da rodada.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8F9FA] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Hero */}
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full -z-10"></div>
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-black text-white text-[10px] font-black mb-6 uppercase tracking-[0.2em]">
              <Zap className="w-3 h-3 text-[#FA007D] fill-[#FA007D]" /> BETA v2.5
            </span>
            <h1 className="text-5xl sm:text-7xl font-bebas text-gray-900 mb-4 tracking-tight uppercase leading-none">
              🔮 Palpites <span className="text-[#FA007D]">DuoDunk</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-inter leading-relaxed">
              Análises preditivas processadas por Inteligência Artificial. Cruzamos estatísticas, <em>momentum</em> e histórico para encontrar as melhores oportunidades.
            </p>
          </div>

          {/* Grid de Palpites */}
          <div className="grid gap-8 md:grid-cols-2">
            {games.map((game) => {
              // Garante que pegamos o primeiro palpite da array
              const palpite = Array.isArray(game.predictions) ? game.predictions[0] : null;
              if (!palpite) return null;

              const confidence = palpite.confidence_score || 50;
              const isHigh = confidence >= 80;
              const isMid = confidence >= 60 && confidence < 80;
              
              const colors = isHigh 
                ? { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-100", label: "Alta Confiança" }
                : isMid 
                ? { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-100", label: "Moderado" }
                : { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-100", label: "Arriscado" };

              return (
                <div key={game.id} className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col relative">
                  <div className={cn("absolute top-0 left-0 w-full h-1.5", colors.bg)} />

                  {/* Matchup */}
                  <div className="px-8 pt-10 pb-6 flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">CASA</span>
                      <h4 className="font-oswald font-bold text-gray-900 text-xl uppercase leading-none">{game.home_team_name}</h4>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                        <span className="text-gray-300 font-bebas text-lg">VS</span>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">FORA</span>
                      <h4 className="font-oswald font-bold text-gray-900 text-xl uppercase leading-none">{game.visitor_team_name}</h4>
                    </div>
                  </div>

                  <div className="px-8"><div className="h-px bg-gray-50 w-full"></div></div>

                  {/* Conteúdo */}
                  <div className="p-8 flex-grow">
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#00DBFB] uppercase tracking-widest mb-2 bg-[#00DBFB]/5 px-2 py-0.5 rounded">
                        <TrendingUp size={10} /> Sugestão da IA
                      </span>
                      <h3 className="text-3xl font-oswald font-black text-gray-900 uppercase leading-none group-hover:text-[#FA007D] transition-colors">
                        {palpite.prediction_title}
                      </h3>
                    </div>

                    <div className={cn("relative p-6 rounded-3xl border bg-gray-50/50", colors.border)}>
                      <div className="flex items-center gap-2 mb-3">
                          <div className={cn("w-2 h-2 rounded-full animate-ping", colors.bg)} />
                          <span className={cn("text-[10px] font-black uppercase tracking-tighter", colors.text)}>
                              {colors.label} — {confidence}%
                          </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed font-inter italic">
                        "{palpite.prediction_analysis}"
                      </p>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="px-8 py-5 bg-zinc-950 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                      <BrainCircuit size={14} className="text-[#FA007D]" />
                      AI Engine 2.5 Flash
                    </div>
                    <div className="flex items-center gap-1 text-zinc-600 text-[9px] font-mono">
                      <Clock size={10} />
                      {new Date(game.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="mt-20 bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-[#FA007D]/20 rounded-full flex items-center justify-center shrink-0 border border-[#FA007D]/30">
                      <AlertCircle size={40} className="text-[#FA007D]" />
                  </div>
                  <div className="text-center md:text-left">
                      <h4 className="text-2xl font-oswald font-bold uppercase mb-2 tracking-tight">O Jogo é Imprevisível</h4>
                      <p className="text-zinc-400 text-sm font-inter leading-relaxed max-w-2xl">
                          Nossos palpites são gerados por algoritmos baseados em dados históricos e tendências. Não garantimos lucros. Use estas informações apenas como suporte para sua própria análise. Jogue com responsabilidade.
                      </p>
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-white">
                  <BrainCircuit size={300} />
               </div>
          </div>
        </div>
      </div>
    );
  } catch (e: any) {
    console.error("Erro na página Palpite:", e);
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
          <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-oswald font-bold text-gray-900 uppercase">Ops! Algo deu errado</h1>
              <p className="text-gray-600 mt-2 font-inter">Não conseguimos carregar os palpites no momento. Tente atualizar a página.</p>
          </div>
        </div>
    );
  }
}