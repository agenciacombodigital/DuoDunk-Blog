import { useEffect, useState } from 'react';
import { buscarLideresEstatisticas, EstatisticaJogador } from '../services/espnApi';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

type CategoriaEstatistica = 'pontos' | 'rebotes' | 'assistencias' | 'roubos' | 'tocos' | 'triplos';

export default function Estatisticas() {
  const [todosJogadores, setTodosJogadores] = useState<EstatisticaJogador[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaEstatistica>('pontos');
  const [carregando, setCarregando] = useState(true);
  const [ordenacao, setOrdenacao] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setCarregando(true);
    try {
      const dados = await buscarLideresEstatisticas();
      // Usamos a lista de pontos como base, pois ela contém todos os jogadores que têm estatísticas.
      // A ordenação e filtragem serão feitas localmente.
      setTodosJogadores(dados.pontos); 
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Ordenar jogadores pela categoria ativa
  const jogadoresOrdenados = [...todosJogadores].sort((a, b) => {
    const valorA = (a[categoriaAtiva] as number) || 0;
    const valorB = (b[categoriaAtiva] as number) || 0;
    return ordenacao === 'desc' ? valorB - valorA : valorA - valorB;
  });

  // Filtrar apenas jogadores que têm estatística na categoria ativa (valor > 0)
  const jogadoresFiltrados = jogadoresOrdenados.filter(
    (jogador) => (jogador[categoriaAtiva] as number) > 0
  );

  const toggleOrdenacao = () => {
    setOrdenacao(ordenacao === 'desc' ? 'asc' : 'desc');
  };

  // Função para lidar com erro de imagem (usando fallback genérico da ESPN)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/default.png&w=350&h=254';
    e.currentTarget.onerror = null; // Previne loop infinito
  };

  // Função para lidar com erro de logo do time
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
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

  const categorias = [
    { key: 'pontos' as CategoriaEstatistica, label: 'Pontos', abrev: 'PTS' },
    { key: 'rebotes' as CategoriaEstatistica, label: 'Rebotes', abrev: 'REB' },
    { key: 'assistencias' as CategoriaEstatistica, label: 'Assistências', abrev: 'AST' },
    { key: 'roubos' as CategoriaEstatistica, label: 'Roubos', abrev: 'STL' },
    { key: 'tocos' as CategoriaEstatistica, label: 'Tocos', abrev: 'BLK' },
    { key: 'triplos' as CategoriaEstatistica, label: 'Triplos', abrev: '3PM' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Igual outras páginas */}
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

      {/* Filtros de Categoria - Estilo pills como Classificação */}
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

      {/* Tabela de Estatísticas - Estilo similar à Classificação */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header da Tabela */}
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="font-oswald text-xl font-bold uppercase">
              {categorias.find((c) => c.key === categoriaAtiva)?.label} - Temporada 2025-26
            </h2>
            <button
              onClick={toggleOrdenacao}
              className="flex items-center gap-2 text-sm font-inter hover:text-pink-400 transition"
            >
              {ordenacao === 'desc' ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
              {ordenacao === 'desc' ? 'Maior → Menor' : 'Menor → Maior'}
            </button>
          </div>

          {/* Cabeçalho das Colunas */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 font-inter text-xs font-semibold text-gray-600 uppercase">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 md:col-span-6">Jogador</div>
            <div className="col-span-2 md:col-span-2 text-center">Time</div>
            <div className="col-span-2 md:col-span-2 text-center">Pos</div>
            <div className="col-span-2 md:col-span-1 text-center font-bold text-pink-600">
              {categorias.find((c) => c.key === categoriaAtiva)?.abrev}
            </div>
          </div>

          {/* Lista de Jogadores */}
          <div className="divide-y divide-gray-200">
            {jogadoresFiltrados.map((jogador, index) => (
              <div
                key={`${jogador.id}-${index}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Ranking */}
                <div className="col-span-1 text-center">
                  <span
                    className={`font-oswald text-lg font-bold ${
                      index === 0
                        ? 'text-yellow-600'
                        : index === 1
                        ? 'text-gray-500'
                        : index === 2
                        ? 'text-orange-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Jogador (Foto + Nome) */}
                <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 overflow-hidden">
                      <img
                        src={jogador.foto}
                        alt={jogador.nome}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                    {/* Logo do time sobreposto */}
                    {jogador.logoTime && (
                      <img
                        src={jogador.logoTime}
                        alt={jogador.siglaTime}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white p-0.5 shadow-sm"
                        onError={handleLogoError}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-oswald font-semibold text-gray-900 truncate text-sm md:text-base">
                      {jogador.nome}
                    </h3>
                  </div>
                </div>

                {/* Time */}
                <div className="col-span-2 md:col-span-2 text-center">
                  <span className="font-inter text-xs md:text-sm font-semibold text-pink-600">
                    {jogador.siglaTime}
                  </span>
                </div>

                {/* Posição */}
                <div className="col-span-2 md:col-span-2 text-center">
                  <span className="font-inter text-xs md:text-sm text-gray-600">
                    {jogador.posicao}
                  </span>
                </div>

                {/* Estatística */}
                <div className="col-span-2 md:col-span-1 text-center">
                  <span className="font-oswald text-lg md:text-2xl font-bold text-pink-600">
                    {((jogador[categoriaAtiva] as number) || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nota Informativa */}
      <section className="container mx-auto px-4 pb-8">
        <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
          <p className="text-sm text-gray-600 font-inter text-center">
            <strong className="text-gray-900">Nota:</strong> Estatísticas atualizadas diariamente com base nos jogos da temporada regular 2025-26. Para qualificação oficial nas lideranças da NBA, um jogador deve participar de pelo menos 70% dos jogos da sua equipe.
          </p>
        </div>
      </section>
    </div>
  );
}