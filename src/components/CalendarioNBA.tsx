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
              {jogosData.map((jogo) => {
                // Adaptação: Transmissões são separadas por vírgula no campo 'canal'
                const transmissoes = jogo.canal ? jogo.canal.split(',').map(t => t.trim()).filter(t => t) : [];
                
                return (
                  <div
                    key={jogo.id}
                    className="
                      rounded-3xl
                      p-6
                      bg-white/40 
                      backdrop-blur-xl
                      border border-white/40
                      shadow-[0_8px_30px_rgba(0,0,0,0.06)]
                      hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
                      transition-all duration-300
                      flex flex-col
                      relative
                    "
                  >
                    {/* Status Badge (Re-adicionado para manter a funcionalidade) */}
                    {jogo.status !== 'agendado' && (
                        <div className={`absolute top-0 left-0 right-0 rounded-t-3xl text-center py-1 text-xs font-bold uppercase font-inter ${
                            jogo.status === 'ao_vivo' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-white'
                        }`}>
                            {jogo.status === 'ao_vivo' ? 'AO VIVO' : 'FINAL'}
                        </div>
                    )}

                    {/* Horário / Placar */}
                    <div className={`flex items-center justify-center mb-4 ${jogo.status !== 'agendado' ? 'mt-4' : ''}`}>
                      {jogo.status === 'agendado' ? (
                        <span className="text-2xl font-black text-gray-900 font-oswald">
                          {jogo.horario}
                        </span>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-black text-gray-900 font-oswald">{jogo.timeVisitante.placar ?? '-'}</span>
                          <span className="text-xl font-black text-pink-600">X</span>
                          <span className="text-3xl font-black text-gray-900 font-oswald">{jogo.timeCasa.placar ?? '-'}</span>
                        </div>
                      )}
                    </div>

                    {/* Times */}
                    <div className="flex items-center justify-center gap-6">
                      <img
                        src={jogo.timeVisitante.logo} 
                        alt={jogo.timeVisitante.sigla}
                        className="w-14 h-14"
                      />
                      <span className="text-2xl font-black text-gray-900 font-oswald">@</span>
                      <img
                        src={jogo.timeCasa.logo} 
                        alt={jogo.timeCasa.sigla}
                        className="w-14 h-14"
                      />
                    </div>

                    {/* Siglas */}
                    <div className="flex justify-center gap-10 mt-3 text-gray-700 font-semibold font-inter">
                      <span>{jogo.timeVisitante.sigla}</span>
                      <span>{jogo.timeCasa.sigla}</span>
                    </div>

                    {/* Transmissões */}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {transmissoes.map((t: string, i: number) => (
                        <span
                          key={i}
                          className="
                            px-3 py-1 
                            rounded-full 
                            bg-pink-100 
                            text-pink-700 
                            text-sm 
                            font-semibold
                            shadow-sm
                            font-inter
                          "
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Arena */}
                    <p className="text-center text-gray-600 text-sm mt-4 font-inter">
                      {jogo.arena}
                    </p>
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