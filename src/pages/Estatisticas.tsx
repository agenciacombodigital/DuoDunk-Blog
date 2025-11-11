import { useEffect, useState } from 'react';
import { buscarLideresEstatisticas, EstatisticaJogador } from '../services/espnApi';
import { TrendingUp, Flame, Target, Zap, Shield, Award, Loader2 } from 'lucide-react';

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
console.log('✅ Dados carregados:', dados);
setLideres(dados);
} catch (error) {
console.error('❌ Erro ao carregar:', error);
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

// Card de líder individual
const CardLider = ({
jogador,
rank,
valor
}: {
jogador: EstatisticaJogador;
rank: number;
valor: number;
}) => (
<div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all group border border-gray-700">
{/* Rank com medalhas */}
<div className="flex-shrink-0">
<span className={`font-oswald text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/50' : ''} ${rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg shadow-gray-400/50' : ''} ${rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/50' : ''} ${rank > 3 ? 'bg-gray-700 text-gray-300 border-2 border-gray-600' : ''} `}>
{rank}
</span>
</div>

  {/* Foto do jogador */}
  <div className="relative flex-shrink-0">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
      <img 
        src={jogador.foto} 
        alt={jogador.nome}
        className="w-full h-full rounded-full object-cover bg-gray-900"
        onError={(e) => {
          e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/default.png&w=350&h=254';
        }}
      />
    </div>
    {/* Logo do time */}
    {jogador.logoTime && (
      <img 
        src={jogador.logoTime} 
        alt={jogador.siglaTime}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white p-0.5 shadow-lg"
        onError={(e) => e.currentTarget.style.display = 'none'}
      />
    )}
  </div>

  {/* Info do jogador */}
  <div className="flex-1 min-w-0">
    <h3 className="font-oswald text-lg font-bold text-white truncate group-hover:text-pink-400 transition">
      {jogador.nome}
    </h3>
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="font-semibold text-pink-500">{jogador.siglaTime}</span>
      <span>- </span>
      <span>{jogador.posicao}</span>
    </div>
  </div>

  {/* Estatística */}
  <div className="flex-shrink-0 text-right">
    <span className="font-oswald text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
      {valor.toFixed(1)}
    </span>
  </div>
</div>
);

// Seção de categoria
const SecaoLideres = ({
titulo,
icone: Icone,
jogadores,
statKey,
corGradiente
}: {
titulo: string;
icone: any;
jogadores: EstatisticaJogador[];
statKey: keyof EstatisticaJogador;
corGradiente: string;
}) => (
<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
{/* Header da categoria */}
<div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
<div className={`p-3 rounded-xl ${corGradiente} shadow-lg`}>
<Icone className="w-7 h-7 text-white" />
</div>
<div className="flex-1">
<h2 className="font-oswald text-2xl font-bold text-white uppercase tracking-wide">
{titulo}
</h2>
<p className="text-sm text-gray-400 font-inter">Top 5 da Temporada 2025-26</p>
</div>
</div>

  {/* Lista de jogadores */}
  <div className="space-y-3">
    {jogadores.length > 0 ? (
      jogadores.map((jogador, index) => (
        <CardLider 
          key={jogador.id} 
          jogador={jogador} 
          rank={index + 1} 
          valor={jogador[statKey] as number}
        />
      ))
    ) : (
      <div className="text-center py-12">
        <p className="text-gray-500 font-inter">Nenhum dado disponível</p>
      </div>
    )}
  </div>
</div>
);

return (
<div className="min-h-screen bg-black text-white">
{/* Hero Section - Igual às outras páginas */}
<section className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 py-16">
<div className="container mx-auto px-4">
<div className="flex items-center gap-4 mb-4">
<div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
<TrendingUp className="w-12 h-12 text-white" />
</div>
<div>
<h1 className="font-oswald text-5xl md:text-6xl font-black uppercase tracking-tight">
Líderes de Estatísticas
</h1>
<p className="text-xl md:text-2xl text-white/90 font-inter mt-2">
Temporada 2025-26 - Atualizado diariamente
</p>
</div>
</div>
</div>
</section>

  {/* Grid de Estatísticas */}
  <section className="container mx-auto px-4 py-12">
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Pontos */}
      <SecaoLideres 
        titulo="Pontos por Jogo"
        icone={Flame}
        jogadores={lideres.pontos}
        statKey="pontos"
        corGradiente="bg-gradient-to-br from-orange-500 to-red-600"
      />

      {/* Rebotes */}
      <SecaoLideres 
        titulo="Rebotes"
        icone={Target}
        jogadores={lideres.rebotes}
        statKey="rebotes"
        corGradiente="bg-gradient-to-br from-blue-500 to-cyan-600"
      />

      {/* Assistências */}
      <SecaoLideres 
        titulo="Assistências"
        icone={Zap}
        jogadores={lideres.assistencias}
        statKey="assistencias"
        corGradiente="bg-gradient-to-br from-green-500 to-emerald-600"
      />

      {/* Tocos */}
      <SecaoLideres 
        titulo="Tocos"
        icone={Shield}
        jogadores={lideres.tocos}
        statKey="tocos"
        corGradiente="bg-gradient-to-br from-purple-500 to-indigo-600"
      />

      {/* Roubos */}
      <SecaoLideres 
        titulo="Roubos de Bola"
        icone={Zap}
        jogadores={lideres.roubos}
        statKey="roubos"
        corGradiente="bg-gradient-to-br from-yellow-500 to-amber-600"
      />

      {/* Triplos */}
      <SecaoLideres 
        titulo="Cestas de 3 Pontos"
        icone={Award}
        jogadores={lideres.triplos}
        statKey="triplosConvertidos"
        corGradiente="bg-gradient-to-br from-pink-500 to-rose-600"
      />
    </div>
  </section>

  {/* Nota Informativa - Igual às outras páginas */}
  <section className="container mx-auto px-4 pb-12">
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-pink-500/10 rounded-lg">
          <TrendingUp className="w-6 h-6 text-pink-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-300 font-inter leading-relaxed">
            <strong className="text-white font-semibold">Nota:</strong> Estatísticas atualizadas diariamente com base nos jogos da temporada regular 2025-26. 
            Para se qualificar nas lideranças oficiais da NBA, um jogador deve participar de pelo menos 70% dos jogos da sua equipe.
          </p>
        </div>
      </div>
    </div>
  </section>
</div>
);
}