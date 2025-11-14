import React, { useEffect, useState } from 'react';
import { buscarJogosHoje, buscarJogosSemana, Jogo } from '../services/espnApi';
import { Loader2, Tv, MapPin } from 'lucide-react';

const CalendarioNBA: React.FC = () => {
  const [modo, setModo] = useState<'hoje' | 'semana'>('hoje');
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarJogos = async () => {
      setCarregando(true);
      const dados = modo === 'hoje' 
        ? await buscarJogosHoje() 
        : await buscarJogosSemana();
      setJogos(dados);
      setCarregando(false);
    };

    carregarJogos();
  }, [modo]);

  // Agrupar jogos por data
  const jogosPorData = jogos.reduce((acc, jogo) => {
    const data = new Date(jogo.data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      timeZone: 'America/Sao_Paulo'
    });
    
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(jogo);
    return acc;
  }, {} as Record<string, Jogo[]>);

  return (
    <div className="my-10 p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="font-oswald text-3xl text-gray-900 mb-6 text-center">🏀 Calendário NBA</h2>
      
      <div className="flex justify-center gap-3 mb-6">
        <button 
          className={`px-6 py-2 border-2 rounded-md font-oswald text-base transition-all ${modo === 'hoje' ? 'bg-pink-700 text-white border-pink-700' : 'border-pink-700 bg-white text-pink-700 hover:bg-pink-50'}`}
          onClick={() => setModo('hoje')}
        >
          Hoje
        </button>
        <button 
          className={`px-6 py-2 border-2 rounded-md font-oswald text-base transition-all ${modo === 'semana' ? 'bg-pink-700 text-white border-pink-700' : 'border-pink-700 bg-white text-pink-700 hover:bg-pink-50'}`}
          onClick={() => setModo('semana')}
        >
          Esta Semana
        </button>
      </div>

      {carregando ? (
        <div className="text-center py-10 text-gray-600 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando jogos...
        </div>
      ) : Object.keys(jogosPorData).length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          Nenhum jogo agendado para este período.
        </div>
      ) : (
        Object.entries(jogosPorData).map(([data, jogosData]) => (
          <div key={data} className="mb-8">
            <h3 className="font-oswald text-xl text-pink-700 capitalize mb-4 pb-2 border-b-2 border-gray-100">{data}</h3>
            
            {/* Novo Grid de Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {jogosData.map((jogo, index) => {
                // Adaptação: Transmissões são separadas por vírgula no campo 'canal'
                const transmissoes = jogo.canal ? jogo.canal.split(',').map(t => t.trim()).filter(t => t) : [];
                
                // Variáveis para o novo JSX
                const timeCasa = jogo.timeCasa;
                const timeVisitante = jogo.timeVisitante;
                
                return (
                  <div
                    key={jogo.id}
                    className="
                      relative
                      p-[2px]
                      rounded-3xl
                      bg-gradient-to-br from-pink-500/30 via-blue-500/20 to-transparent
                      animate-gradient-move
                      transition-all
                      duration-500
                      hover:scale-[1.03]
                      hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]
                    "
                  >
                    {/* Fundo glass */}
                    <div
                      className="
                        rounded-3xl
                        bg-white/30 
                        backdrop-blur-2xl
                        border border-white/40
                        shadow-[inset_0_0_20px_rgba(255,255,255,0.3),0_15px_40px_rgba(0,0,0,0.1)]
                        p-6
                        transition-all duration-500
                        flex flex-col
                        h-full
                      "
                    >
                      {/* Status Badge (Mantido, mas estilizado para o novo visual) */}
                      {jogo.status !== 'agendado' && (
                          <div className={`absolute top-0 left-0 right-0 rounded-t-3xl text-center py-1 text-xs font-bold uppercase font-inter ${
                              jogo.status === 'ao_vivo' ? 'bg-red-600/80 text-white animate-pulse' : 'bg-gray-700/80 text-white'
                          }`}>
                              {jogo.status === 'ao_vivo' ? 'AO VIVO' : 'FINAL'}
                          </div>
                      )}

                      {/* Glow superior (reflexo elegante) */}
                      <div className="
                        pointer-events-none
                        absolute top-0 left-0 right-0
                        h-16
                        bg-gradient-to-b from-white/40 to-transparent
                        rounded-t-3xl
                      " />

                      {/* Horário */}
                      <div className="flex items-center justify-center mb-5 mt-4">
                        <span className="
                          text-2xl font-black text-gray-900 font-oswald
                          px-4 py-1
                          rounded-full
                          bg-gradient-to-r from-pink-500/20 to-blue-500/20
                          shadow-inner
                          backdrop-blur-xl
                        ">
                          {jogo.status === 'agendado' ? jogo.horario : `${timeVisitante.placar} x ${timeCasa.placar}`}
                        </span>
                      </div>

                      {/* Times */}
                      <div className="flex items-center justify-center gap-8 relative">
                        <img
                          src={timeVisitante.logo}
                          alt={timeVisitante.sigla}
                          className="
                            w-16 h-16 drop-shadow-xl transition duration-300
                            hover:drop-shadow-[0_0_12px_rgba(236,72,153,0.7)]
                          "
                        />
                        <span className="text-2xl font-black text-gray-900 font-oswald">@</span>
                        <img
                          src={timeCasa.logo}
                          alt={timeCasa.sigla}
                          className="
                            w-16 h-16 drop-shadow-xl transition duration-300
                            hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]
                          "
                        />
                      </div>

                      {/* Siglas */}
                      <div className="flex justify-center gap-12 mt-3 text-gray-700 font-semibold text-lg tracking-wide font-inter">
                        <span>{timeVisitante.sigla}</span>
                        <span>{timeCasa.sigla}</span>
                      </div>

                      {/* Transmissões */}
                      <div className="flex flex-wrap gap-2 mt-5 justify-center">
                        {transmissoes.map((t: string, i: number) => (
                          <span
                            key={i}
                            className="
                              px-4 py-1.5 
                              rounded-full 
                              bg-gradient-to-r from-pink-500/20 to-blue-500/20
                              text-gray-900
                              text-sm 
                              font-semibold
                              shadow-sm
                              backdrop-blur-xl
                              border border-white/40
                              font-inter
                            "
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Arena */}
                      <p className="text-center text-gray-600 text-sm mt-5 tracking-tight font-inter">
                        {jogo.arena}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CalendarioNBA;