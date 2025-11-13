import { useEffect, useState, useMemo } from 'react';
import { getTopPlayers, PlayerLeader, STAT_CATEGORIES } from '../services/nbaCoreStatsService';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

type CategoriaEstatisticaKey = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' | 'threePointFieldGoalsMade' | 'fieldGoalPercentage' | 'freeThrowPercentage';

export default function Estatisticas() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaEstatisticaKey>('points');
  const [carregando, setCarregando] = useState(true);
  const [ordenacao, setOrdenacao] = useState<'asc' | 'desc'>('desc');
  const [jogadores, setJogadores] = useState<PlayerLeader[]>([]);

  // Mapeamento de chaves para o nome de exibição
  const categorias = STAT_CATEGORIES.map(c => ({
    key: c.key as CategoriaEstatisticaKey,
    label: c.name,
    abrev: c.abbreviation,
  }));

  useEffect(() => {
    const carregarEstatisticas = () => {
      setCarregando(true);
      try {
        // Usando o novo serviço para carregar os top players da categoria ativa
        const dados = getTopPlayers(categoriaAtiva, 50); // Busca os 50 primeiros
        setJogadores(dados); 
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setJogadores([]);
      } finally {
        setCarregando(false);
      }
    };
    carregarEstatisticas();
  }, [categoriaAtiva]); // Recarrega quando a categoria muda

  const jogadoresExibidos = useMemo(() => {
    return [...jogadores]
      .sort((a, b) => {
        return ordenacao === 'desc' ? b.value - a.value : a.value - b.value;
      });
  }, [jogadores, ordenacao]);

  const toggleOrdenacao = () => {
    setOrdenacao(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/default.png&w=350&h=254';
    e.currentTarget.onerror = null;
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  const categoriaInfo = categorias.find(c => c.key === categoriaAtiva);
  const categoriaNome = categoriaInfo?.label || 'Estatísticas';
  const categoriaAbrev = categoriaInfo?.abrev || 'VAL';
  
  // Helper para formatar o valor (1 casa decimal, exceto para contagens inteiras)
  const formatValue = (value: number, abbrev: string) => {
    if (abbrev.includes('%')) {
      return value.toFixed(1) + '%';
    }
    // Se for uma contagem (PTS, REB, AST, etc.), mostra como inteiro se for inteiro
    if (['PTS', 'REB', 'AST', 'STL', 'BLK', '3PM'].includes(abbrev)) {
      return Math.round(value) === value ? value.toString() : value.toFixed(1);
    }
    return value.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-pink-600" />
            </div>
            <h1 className="font-oswald text-4xl md:text-5xl font-bold text-gray-900 uppercase">
              Estatísticas NBA
            </h1>
          </div>
          <p className="text-gray-600 font-inter ml-14">
            Líderes da Temporada 2025-26 • Atualizado diariamente
          </p>
        </div>
      </section>

      <section className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categorias.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoriaAtiva(cat.key)}
                className={`
                  px-6 py-2.5 rounded-full font-inter font-semibold text-sm transition-all
                  ${
                    categoriaAtiva === cat.key
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="font-oswald text-xl font-bold uppercase">
              {categoriaNome} - Temporada 2025-26
            </h2>
            <button
              onClick={toggleOrdenacao}
              className="flex items-center gap-2 text-sm font-inter hover:text-pink-400 transition"
            >
              {ordenacao === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {ordenacao === 'desc' ? 'Maior → Menor' : 'Menor → Maior'}
            </button>
          </div>

          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 font-inter text-xs font-semibold text-gray-600 uppercase">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-7 md:col-span-8">Jogador</div>
            <div className="col-span-2 md:col-span-1 text-center">Time</div>
            <div className="col-span-2 md:col-span-2 text-center font-bold text-pink-600">
              {categoriaAbrev}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {jogadoresExibidos.map((jogador, index) => (
              <div
                key={jogador.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="col-span-1 text-center">
                  <span className={`font-oswald text-lg font-bold ${index < 3 ? ['text-yellow-600', 'text-gray-500', 'text-orange-600'][index] : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                </div>

                <div className="col-span-7 md:col-span-8 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 overflow-hidden">
                      <img src={jogador.headshot} alt={jogador.name} className="w-full h-full object-cover" onError={handleImageError} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-oswald font-semibold text-gray-900 truncate text-sm md:text-base">
                      {jogador.name}
                    </h3>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 text-center">
                  <span className="font-inter text-xs md:text-sm font-semibold text-pink-600">
                    {jogador.team || 'N/D'}
                  </span>
                </div>

                <div className="col-span-2 md:col-span-2 text-center">
                  <span className="font-oswald text-lg md:text-2xl font-bold text-pink-600">
                    {formatValue(jogador.value, categoriaAbrev)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8">
        <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
          <p className="text-sm text-gray-600 font-inter text-center">
            <strong className="text-gray-900">Nota:</strong> Estatísticas atualizadas diariamente com base nos jogos da temporada regular 2025-26.
          </p>
        </div>
      </section>
    </div>
  );
}