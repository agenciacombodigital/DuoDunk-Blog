import { useEffect, useState } from 'react';
import { buscarLideresEstatisticas, EstatisticaJogador } from '../services/espnApi';
import { TrendingUp, Award, Target, Shield, Zap, Flame, Loader2 } from 'lucide-react';

export default function Estatisticas() {
  const [lideres, setLideres] = useState<{
    pontos: EstatisticaJogador[];
    rebotes: EstatisticaJogador[];
    assistencias: EstatisticaJogador[];
    roubos: EstatisticaJogador[];
    tocos: EstatisticaJogador[];
    triplos: EstatisticaJogador[];
  }>({
    pontos: [],
    rebotes: [],
    assistencias: [],
    roubos: [],
    tocos: [],
    triplos: []
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setCarregando(true);
    try {
      const dados = await buscarLideresEstatisticas();
      setLideres(dados);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const CardLider = ({ jogador, rank, stat }: { jogador: EstatisticaJogador; rank: number; stat: keyof EstatisticaJogador }) => (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group">
      {/* Rank */}
      <div className="flex-shrink-0">
        <span className={`
          font-oswald text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full
          ${rank === 1 ? 'bg-yellow-500 text-black' : ''}
          ${rank === 2 ? 'bg-gray-400 text-black' : ''}
          ${rank === 3 ? 'bg-orange-600 text-white' : ''}
          ${rank > 3 ? 'bg-gray-700 text-gray-300' : ''}
        `}>
          {rank}
        </span>
      </div>

      {/* Foto e Logo do Time */}
      <div className="relative flex-shrink-0">
        {jogador.foto ? (
          <img 
            src={jogador.foto} 
            alt={jogador.nome}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-600"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
            <Award className="w-6 h-6 text-gray-400" />
          </div>
        )}
        {jogador.logoTime && (
          <img 
            src={jogador.logoTime} 
            alt={jogador.siglaTime}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white p-0.5"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Info do Jogador */}
      <div className="flex-1 min-w-0">
        <h3 className="font-oswald text-lg font-semibold text-white truncate group-hover:text-pink-400 transition">
          {jogador.nome}
        </h3>
        <p className="text-sm text-gray-400">
          {jogador.siglaTime} • {jogador.posicao}
        </p>
      </div>

      {/* Estatística */}
      <div className="flex-shrink-0 text-right">
        <span className="font-oswald text-3xl font-bold text-pink-500">
          {typeof jogador[stat] === 'number' ? jogador[stat].toFixed(1) : '0.0'}
        </span>
      </div>
    </div>
  );

  const SecaoLideres = ({ 
    titulo, 
    icone: Icone, 
    jogadores, 
    stat, 
    cor 
  }: { 
    titulo: string; 
    icone: any; 
    jogadores: EstatisticaJogador[]; 
    stat: keyof EstatisticaJogador;
    cor: string;
  }) => (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className={`p-3 rounded-xl ${cor}`}>
          <Icone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-oswald text-2xl font-bold text-white uppercase">
            {titulo}
          </h2>
          <p className="text-sm text-gray-400">Top 5 da Temporada 2025-26</p>
        </div>
      </div>

      {/* Lista de Jogadores */}
      <div className="space-y-3">
        {jogadores.length > 0 ? (
          jogadores.map((jogador, index) => (
            <CardLider 
              key={jogador.id} 
              jogador={jogador} 
              rank={index + 1} 
              stat={stat}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">Dados não disponíveis</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-600 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-10 h-10 text-white" />
            <h1 className="font-oswald text-5xl font-bold uppercase">
              Líderes de Estatísticas
            </h1>
          </div>
          <p className="text-xl text-white/90 font-inter">
            Temporada 2025-26 • Atualizado diariamente
          </p>
        </div>
      </section>

      {/* Grid de Estatísticas */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Pontos */}
          <SecaoLideres 
            titulo="Pontos por Jogo"
            icone={Flame}
            jogadores={lideres.pontos}
            stat="pontos"
            cor="bg-orange-500"
          />

          {/* Rebotes */}
          <SecaoLideres 
            titulo="Rebotes"
            icone={Target}
            jogadores={lideres.rebotes}
            stat="rebotes"
            cor="bg-blue-500"
          />

          {/* Assistências */}
          <SecaoLideres 
            titulo="Assistências"
            icone={Zap}
            jogadores={lideres.assistencias}
            stat="assistencias"
            cor="bg-green-500"
          />

          {/* Tocos */}
          <SecaoLideres 
            titulo="Tocos"
            icone={Shield}
            jogadores={lideres.tocos}
            stat="tocos"
            cor="bg-purple-500"
          />

          {/* Roubos */}
          <SecaoLideres 
            titulo="Roubos de Bola"
            icone={Zap}
            jogadores={lideres.roubos}
            stat="roubos"
            cor="bg-yellow-500"
          />

          {/* Triplos */}
          <SecaoLideres 
            titulo="Cestas de 3 Pontos"
            icone={Award}
            jogadores={lideres.triplos}
            stat="triplosConvertidos"
            cor="bg-pink-500"
          />
        </div>
      </section>

      {/* Nota Informativa */}
      <section className="container mx-auto px-4 pb-12">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-sm text-gray-400 font-inter text-center">
            <strong className="text-white">Nota:</strong> Estatísticas atualizadas diariamente. 
            Para se qualificar para liderança, um jogador deve participar de pelo menos 70% dos jogos da equipe.
          </p>
        </div>
      </section>
    </div>
  );
}