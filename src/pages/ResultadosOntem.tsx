import { useEffect, useState } from 'react';
import { buscarJogosOntemComBoxScore, GameBoxScore } from '../services/nbaBoxScore';
import BoxScoreJogo from '../components/BoxScoreJogo';
import { Loader2, Trophy } from 'lucide-react';

export default function ResultadosOntem() {
  const [jogos, setJogos] = useState<GameBoxScore[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const dados = await buscarJogosOntemComBoxScore();
      setJogos(dados);
      setCarregando(false);
    }
    carregar();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando resultados dos jogos finalizados...</p>
        </div>
      </div>
    );
  }

  const dataOntem = new Date();
  dataOntem.setDate(dataOntem.getDate() - 1);
  const dataFormatada = dataOntem.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-pink-600" />
            <h1 className="font-oswald text-4xl md:text-5xl font-bold text-gray-900 uppercase">
              Resultados da Rodada
            </h1>
          </div>
          <p className="text-gray-600 font-inter mt-2 ml-12">
            Confira todos os jogos e estatísticas da rodada de {dataFormatada}
          </p>
        </div>
      </section>

      {/* Lista de Jogos */}
      <section className="container mx-auto px-4 py-8">
        {jogos.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-xl shadow-lg border border-gray-200">
            <p className="text-gray-500 text-lg font-inter">
              Nenhum jogo finalizado encontrado na rodada de ontem.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {jogos.map((jogo) => (
              <BoxScoreJogo key={jogo.gameId} boxScore={jogo} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}