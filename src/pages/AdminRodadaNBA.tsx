import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Plus, Trash2, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Game {
  id: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  broadcast: string;
}

export default function AdminRodadaNBA() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [games, setGames] = useState<Game[]>([
    { id: '1', time: '20:00', homeTeam: '', awayTeam: '', broadcast: 'Prime Video' }
  ]);

  const addGame = () => {
    setGames([...games, {
      id: Date.now().toString(),
      time: '21:00',
      homeTeam: '',
      awayTeam: '',
      broadcast: 'League Pass'
    }]);
  };

  const removeGame = (id: string) => {
    setGames(games.filter(g => g.id !== id));
  };

  const updateGame = (id: string, field: keyof Game, value: string) => {
    setGames(games.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (games.some(g => !g.homeTeam || !g.awayTeam)) {
      toast.error('Preencha todos os times!');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Criando post de rodada...');

    try {
      const dateObj = new Date(`${date}T12:00:00Z`); // Use um horário fixo para evitar problemas de fuso
      const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
      const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });

      // Título
      const title = `Rodada NBA - ${dateStr}: ${games.length} ${games.length === 1 ? 'jogo agita' : 'jogos agitam'} a ${weekDay}!`;

      // Resumo
      const mainGame = games[0];
      const summary = `${mainGame.awayTeam} x ${mainGame.homeTeam}${games.length > 1 ? ` e mais ${games.length - 1} confrontos` : ''} movimentam a rodada de hoje. Confira horários e onde assistir!`;

      // Corpo HTML
      let body = '<div class="schedule-post" style="font-family: system-ui, -apple-system, sans-serif;">';
      body += `<h2 style="color: #e91e63; font-size: 28px; margin-bottom: 20px;">🏀 JOGOS DE HOJE (${dateStr})</h2>`;
      body += '<div style="border-bottom: 3px solid #e91e63; margin: 20px 0;"></div>';

      games.forEach((game, index) => {
        const isMainGame = index === 0;
        const broadcastIcon = game.broadcast.includes('Prime') ? '🎬' : 
                             game.broadcast.includes('ESPN') ? '📺' : '🌐';

        body += `
          <div style="margin-bottom: 25px; padding: 20px; background: ${isMainGame ? '#fff3f8' : '#f9f9f9'}; border-radius: 12px; border: 2px solid ${isMainGame ? '#e91e63' : '#e1e1e1'};">
            ${isMainGame ? '<h3 style="color: #e91e63; margin: 0 0 15px 0; font-size: 18px;">🔥 JOGO PRINCIPAL</h3>' : ''}
            
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
              <span style="font-size: 18px; font-weight: bold; color: #333;">${game.time} (BR)</span>
              <span style="padding: 4px 12px; background: ${isMainGame ? '#e91e63' : '#333'}; color: white; border-radius: 20px; font-size: 12px; font-weight: 600;">
                ${broadcastIcon} ${game.broadcast}
              </span>
            </div>
            
            <p style="font-size: 22px; font-weight: bold; margin: 15px 0; color: #000;">
              ${game.awayTeam} <span style="color: #999;">vs</span> ${game.homeTeam}
            </p>
          </div>
        `;
      });

      body += '<div style="border-bottom: 2px solid #e1e1e1; margin: 30px 0;"></div>';
      body += '<h3 style="color: #333; font-size: 22px; margin-bottom: 15px;">📺 ONDE ASSISTIR?</h3>';
      body += '<ul style="list-style: none; padding: 0;">';
      
      const hasPrime = games.some(g => g.broadcast.includes('Prime'));
      const hasESPN = games.some(g => g.broadcast.includes('ESPN'));
      const hasLeague = games.some(g => g.broadcast.includes('League'));

      if (hasPrime) body += '<li style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;"><strong>🎬 Prime Video:</strong> Jogo principal da rodada</li>';
      if (hasESPN) body += '<li style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;"><strong>📺 ESPN Brasil:</strong> Jogos selecionados</li>';
      if (hasLeague) body += '<li style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;"><strong>🌐 NBA League Pass:</strong> Todos os demais jogos</li>';
      
      body += '</ul>';
      body += '<div style="margin-top: 30px; padding: 15px; background: #fff3f8; border-left: 4px solid #e91e63; border-radius: 4px;">';
      body += '<p style="margin: 0; color: #666; font-size: 14px;"><strong>💬 Participe!</strong> Deixe seu comentário e palpite para os jogos de hoje!</p>';
      body += '</div>';
      body += '</div>';

      const slug = `rodada-nba-${dateStr.replace(/\//g, '-')}-${Date.now()}`;

      const { error } = await supabase.from('articles').insert({
        title,
        subtitle: `Confira todos os ${games.length} jogos, horários e transmissões da rodada`,
        summary,
        body,
        slug,
        meta_description: summary.substring(0, 160),
        tags: ['nba', 'rodada', 'jogos-de-hoje', 'horarios', 'onde-assistir'],
        image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=630&fit=crop',
        source: 'DuoDunk - Rodada NBA',
        original_link: null,
        published: true,
        published_at: new Date().toISOString(),
        views: 0
      });

      if (error) throw error;

      toast.success('Post de rodada criado!', { id: toastId });
      navigate('/admin');
    } catch (error: any) {
      toast.error('Erro ao criar post', { id: toastId, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Admin
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            🏀 Criar Post de Rodada NBA
          </h1>
          <p className="text-gray-400">
            Adicione os jogos do dia de forma rápida e fácil
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              📅 Data dos Jogos
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            />
          </div>

          {/* Lista de Jogos */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Jogos ({games.length})</h3>
              <button
                type="button"
                onClick={addGame}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Jogo
              </button>
            </div>

            <div className="space-y-4">
              {games.map((game, index) => (
                <div key={game.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-bold text-pink-400">
                      {index === 0 ? '🔥 JOGO PRINCIPAL' : `JOGO ${index + 1}`}
                    </span>
                    {games.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGame(game.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="time"
                      value={game.time}
                      onChange={(e) => updateGame(game.id, 'time', e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Horário"
                    />
                    <input
                      type="text"
                      value={game.awayTeam}
                      onChange={(e) => updateGame(game.id, 'awayTeam', e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Time Visitante"
                      required
                    />
                    <input
                      type="text"
                      value={game.homeTeam}
                      onChange={(e) => updateGame(game.id, 'homeTeam', e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Time Mandante"
                      required
                    />
                    <select
                      value={game.broadcast}
                      onChange={(e) => updateGame(game.id, 'broadcast', e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option>Prime Video</option>
                      <option>ESPN Brasil</option>
                      <option>League Pass</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-3">👁️ Preview</h3>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-pink-400 font-bold mb-2">
                Rodada NBA - {new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}: {games.length} {games.length === 1 ? 'jogo agita' : 'jogos agitam'} a {new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' })}!
              </p>
              <p className="text-gray-400 text-sm">
                {games[0]?.awayTeam || 'Time 1'} x {games[0]?.homeTeam || 'Time 2'} e mais {games.length - 1} confrontos...
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Publicar Rodada NBA
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}