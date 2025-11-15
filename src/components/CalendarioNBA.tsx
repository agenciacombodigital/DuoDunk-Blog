import React, { useEffect, useState } from 'react';
import { buscarJogosHoje, buscarJogosSemana, Jogo, formatBroadcast } from '../services/espnApi';
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

  const renderJogo = (jogo: Jogo) => {
    const statusClasses = {
      agendado: 'border-l-pink-700',
      aovivo: 'border-l-red-500 bg-red-50',
      finalizado: 'border-l-blue-800',
    };
    
    const transmissao = formatBroadcast(jogo);

    return (
      <div key={jogo.id} className={`bg-gray-50 rounded-lg p-4 border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${statusClasses[jogo.status]}`}>
        <div className="text-xs font-semibold mb-3 text-gray-600">
          {jogo.status === 'aovivo' && <span className="text-red-500 animate-pulse">🔴 AO VIVO</span>}
          {jogo.status === 'finalizado' && <span className="text-blue-800">✅ FINAL</span>}
          {jogo.status === 'agendado' && `⏰ ${jogo.horario}`}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3 mb-3">
          <div className="flex items-center justify-around w-full">
            <div className="flex items-center gap-3 flex-1">
              <img src={jogo.timeVisitante.logo} alt={jogo.timeVisitante.nome} className="w-10 h-10 object-contain" />
              <span className="font-oswald text-base font-semibold text-gray-900">{jogo.timeVisitante.sigla}</span>
            </div>
            {jogo.status !== 'agendado' && (
              <span className="font-oswald text-xl font-bold text-gray-800">{jogo.timeVisitante.placar ?? '-'}</span>
            )}

            <span className="text-sm text-gray-500 font-semibold mx-2">@</span>

            {jogo.status !== 'agendado' && (
              <span className="font-oswald text-xl font-bold text-gray-800">{jogo.timeCasa.placar ?? '-'}</span>
            )}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className="font-oswald text-base font-semibold text-gray-900">{jogo.timeCasa.sigla}</span>
              <img src={jogo.timeCasa.logo} alt={jogo.timeCasa.nome} className="w-10 h-10 object-contain" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-200 gap-2">
          {/* Exibe a transmissão formatada */}
          <span className="flex items-center gap-1 font-bold text-pink-700">
            <Tv size={14} /> {transmissao}
          </span>
          {/* Mantém a arena como informação secundária */}
          {jogo.arena && <span className="flex items-center gap-1"><MapPin size={14} /> {jogo.arena}</span>}
        </div>
      </div>
    );
  };

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
          disabled={carregando}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jogosData.map(renderJogo)}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CalendarioNBA;