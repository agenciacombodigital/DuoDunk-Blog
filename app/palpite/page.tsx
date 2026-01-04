import { supabaseServer } from '@/integrations/supabase/server';
import { Metadata } from 'next';
import { BrainCircuit, Zap, AlertCircle } from 'lucide-react';
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
  // Busca os jogos e palpites relacionados
  const { data: games } = await supabaseServer
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
    .limit(10);

  if (!games || games.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <BrainCircuit className="w-16 h-16 text-pink-600 mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-oswald font-bold text-gray-800 uppercase">A IA está aquecendo... 🤖🏀</h1>
            <p className="text-gray-600 mt-2 font-inter">Nenhum palpite gerado para hoje ainda. Volte em breve!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-4 uppercase tracking-widest border border-pink-200">
            <Zap className="w-3 h-3 fill-current" /> IA DuoDunk v2.5
          </span>
          <h1 className="text-4xl sm:text-6xl font-bebas text-gray-900 mb-4 tracking-tight uppercase">
            🔮 Palpites da Rodada
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter leading-relaxed">
            Nossa Inteligência Artificial analisa histórico, confrontos diretos e estatísticas avançadas para prever os resultados da NBA.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {games.map((game) => {
            const palpite = game.predictions?.[0];
            if (!palpite) return null;

            // Cores Dinâmicas baseadas na Confiança
            let confidenceColor = "text-red-500";
            let confidenceBg = "bg-red-500";
            let confidenceBorder = "border-red-200";
            let confidenceLabel = "Arriscado";
            
            if (palpite.confidence_score >= 80) {
              confidenceColor = "text-emerald-600";
              confidenceBg = "bg-emerald-500";
              confidenceBorder = "border-emerald-200";
              confidenceLabel = "Alta Confiança";
            } else if (palpite.confidence_score >= 60) {
              confidenceColor = "text-amber-600";
              confidenceBg = "bg-amber-500";
              confidenceBorder = "border-amber-200";
              confidenceLabel = "Moderado";
            }

            return (
              <div key={game.id} className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden relative flex flex-col">
                {/* Header do Jogo */}
                <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MANDANTE</span>
                    <span className="font-oswald font-bold text-gray-900 text-lg uppercase leading-none">{game.home_team_name}</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-pink-600 font-bebas text-2xl">VS</span>
                  </div>
                  <div className="flex flex-col flex-1 text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">VISITANTE</span>
                    <span className="font-oswald font-bold text-gray-900 text-lg uppercase leading-none">{game.visitor_team_name}</span>
                  </div>
                </div>

                {/* Corpo do Palpite */}
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Dica de Aposta</span>
                      <h3 className="text-2xl font-oswald font-black text-gray-900 uppercase leading-tight group-hover:text-pink-600 transition-colors">
                        {palpite.prediction_title}
                      </h3>
                    </div>
                  </div>

                  <div className={cn("relative p-5 rounded-2xl border-l-4 bg-gray-50", confidenceBorder)}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", confidenceBg)} />
                        <span className={cn("text-[10px] font-black uppercase tracking-tighter", confidenceColor)}>
                            {confidenceLabel} ({palpite.confidence_score}%)
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed font-inter italic">
                      "{palpite.prediction_analysis}"
                    </p>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 bg-zinc-950 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                    <BrainCircuit size={12} className="text-pink-500" />
                    AI Engine 2.5 Flash
                  </div>
                  <span className="text-[9px] text-zinc-600 font-mono">
                    ID: {game.id.toString().slice(0,8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
             <div className="relative z-10">
                <h4 className="text-2xl font-oswald font-bold uppercase mb-2">Aviso Importante</h4>
                <p className="text-blue-100 text-sm font-inter leading-relaxed max-w-2xl">
                    Nossos palpites são gerados por algoritmos baseados em dados históricos. O basquete é um esporte imprevisível e não garantimos lucros. Jogue com responsabilidade.
                </p>
             </div>
             <div className="absolute top-[-20px] right-[-20px] opacity-10">
                <AlertCircle size={150} />
             </div>
        </div>
      </div>
    </div>
  );
}