import { buscarJogosOntemComBoxScore, GameBoxScore } from '@/services/nbaBoxScore';
import BoxScoreJogo from '@/components/BoxScoreJogo';
import { Trophy } from 'lucide-react';
import { Metadata } from 'next';

// Função de busca de dados no servidor (SSR)
async function loadResults() {
  // Esta função usa axios, então não precisa de supabaseSSR diretamente,
  // mas mantemos a estrutura para garantir que o SSR funcione.
  return await buscarJogosOntemComBoxScore();
}

// Função de metadados dinâmicos
export async function generateMetadata(): Promise<Metadata> {
  const dataOntem = new Date();
  dataOntem.setDate(dataOntem.getDate() - 1);
  const dataFormatada = dataOntem.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  return {
    title: `Resultados NBA de Ontem - Rodada ${dataFormatada}`,
    description: `Confira todos os placares e estatísticas dos jogos da rodada da NBA de ${dataFormatada}. Box score completo e destaques.`,
    alternates: {
      canonical: 'https://www.duodunk.com.br/resultados-ontem',
    },
  };
}

export default async function ResultadosOntem() {
  const jogos = await loadResults();

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