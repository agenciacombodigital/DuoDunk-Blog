import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Plus, Trash2, Calendar, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Game {
  id: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  broadcasts: {
    primeVideo: boolean;
    espn: boolean;
    leaguePass: boolean;
  };
}

export default function AdminRodadaNBA() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [intro, setIntro] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=630&fit=crop');
  const [games, setGames] = useState<Game[]>([
    { 
      id: '1', 
      time: '20:00', 
      homeTeam: '', 
      awayTeam: '', 
      broadcasts: { primeVideo: false, espn: false, leaguePass: true }
    }
  ]);

  const addGame = () => {
    setGames([...games, {
      id: Date.now().toString(),
      time: '21:00',
      homeTeam: '',
      awayTeam: '',
      broadcasts: { primeVideo: false, espn: false, leaguePass: true }
    }]);
  };

  const removeGame = (id: string) => {
    setGames(games.filter(g => g.id !== id));
  };

  const updateGame = (id: string, field: string, value: any) => {
    setGames(games.map(g => {
      if (g.id !== id) return g;
      if (field.startsWith('broadcast_')) {
        const broadcastType = field.replace('broadcast_', '');
        return { ...g, broadcasts: { ...g.broadcasts, [broadcastType]: value } };
      }
      return { ...g, [field]: value };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (games.some(g => !g.homeTeam || !g.awayTeam)) {
      toast.error('Preencha todos os times!');
      return;
    }

    if (!title || !intro) {
      toast.error('Preencha título e texto introdutório!');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Criando post de rodada...');

    try {
      const dateObj = new Date(`${date}T12:00:00Z`);
      const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

      // Criar corpo HTML
      let body = '<div class="schedule-post" style="font-family: system-ui, -apple-system, sans-serif;">';
      
      // Texto introdutório
      if (intro) {
        body += `<div style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px; border-left: 4px solid #e91e63;">`;
        body += `<p style="color: #333; line-height: 1.8; margin: 0;">${intro.replace(/\n/g, '<br>')}</p>`;
        body += `</div>`;
      }

      body += '<h2 style="color: #e91e63; font-size: 28px; margin-bottom: 20px;">🏀 JOGOS DA NOITE</h2>';
      body += '<div style="border-bottom: 3px solid #e91e63; margin: 20px 0;"></div>';

      games.forEach((game) => {
        // Determinar transmissões
        const transmissions = [];
        if (game.broadcasts.primeVideo) transmissions.push({ name: 'Prime Video', icon: '🎬' });
        if (game.broadcasts.espn) transmissions.push({ name: 'ESPN Brasil', icon: '📺' });
        if (game.broadcasts.leaguePass) transmissions.push({ name: 'League Pass', icon: '🌐' });

        body += `
          <div style="margin-bottom: 25px; padding: 20px; background: #f9f9f9; border-radius: 12px; border: 2px solid #e1e1e1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
              <span style="font-size: 18px; font-weight: bold; color: #333;">⏰ ${game.time} (BR)</span>
              ${transmissions.map(t => `
                <span style="padding: 4px 12px; background: #333; color: white; border-radius: 20px; font-size: 12px; font-weight: 600;">
                  ${t.icon} ${t.name}
                </span>
              `).join('')}
            </div>
            
            <p style="font-size: 22px; font-weight: bold; margin: 0; color: #000;">
              ${game.awayTeam} <span style="color: #999;">vs</span> ${game.homeTeam}
            </p>
          </div>
        `;
      });

      body += '<div style="border-bottom: 2px solid #e1e1e1; margin: 30px 0;"></div>';
      body += '<h3 style="color: #333; font-size: 22px; margin-bottom: 15px;">📺 ONDE ASSISTIR?</h3>';
      body += '<ul style="list-style: none; padding: 0;">';
      
      const hasPrime = games.some(g => g.broadcasts.primeVideo);
      const hasESPN = games.some(g => g.broadcasts.espn);
      const hasLeague = games.some(g => g.broadcasts.leaguePass);

      if (hasPrime) body += '<li style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;"><strong>🎬 Prime Video:</strong> Jogos selecionados da rodada</li>';
      if (hasESPN) body += '<li style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;"><strong>📺 ESPN Brasil:</strong> Jogos em destaque</li>';
      if (hasLeague) body += '<li style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;"><strong>🌐 NBA League Pass:</strong> Todos os jogos da NBA</li>';
      
      body += '</ul>';
      body += '<div style="margin-top: 30px; padding: 15px; background: #fff3f8; border-left: 4px solid #e91e63; border-radius: 4px;">';
      body += '<p style="margin: 0; color: #666; font-size: 14px;"><strong>💬 Participe!</strong> Deixe seu comentário e palpite para os jogos de hoje!</p>';
      body += '</div>';
      body += '</div>';

      const slug = `rodada-nba-${dateStr.replace(/\//g, '-')}-${Date.now()}`;
      
      const summary = intro.substring(0, 240) || `${games[0]?.awayTeam || 'Times'} x ${games[0]?.homeTeam || 'confrontam-se'} e mais ${games.length - 1} jogos movimentam a rodada de hoje. Confira horários e onde assistir!`;

      const { error } = await supabase.from('articles').insert({
        title: title || `Rodada NBA - ${dateStr}: ${games.length} ${games.length === 1 ? 'jogo' : 'jogos'} da noite!`,
        subtitle: subtitle || `Confira todos os ${games.length} jogos, horários e transmissões`,
        summary,
        body,
        slug,
        meta_description: summary.substring(0, 160),
        tags: ['nba', 'rodada', 'jogos-de-hoje', 'horarios', 'onde-assistir'],
        image_url: imageUrl,
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
            Adicione os jogos da noite de forma rápida e fácil
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              📅 Data dos Jogos *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
              required
            />
          </div>

          {/* Título */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              📰 Título da Rodada *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
              placeholder="Ex: Rodada NBA - 20/10: 6 jogos agitam a noite!"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/80 caracteres</p>
          </div>

          {/* Subtítulo */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              📝 Subtítulo (opcional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={100}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
              placeholder="Ex: Confira horários e onde assistir cada confronto"
            />
            <p className="text-xs text-gray-500 mt-1">{subtitle.length}/100 caracteres</p>
          </div>

          {/* Texto Introdutório */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              ✍️ Texto Introdutório *
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
              placeholder="Ex: A rodada de hoje traz confrontos emocionantes com destaque para..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">{intro.length}/500 caracteres</p>
          </div>

          {/* Imagem */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              🖼️ Imagem da Capa
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <button
                type="button"
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 transition"
                title="Upload (em breve)"
                disabled
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="mt-3 w-full h-48 object-cover rounded-lg"
                onError={() => setImageUrl('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200')}
              />
            )}
          </div>

          {/* Lista de Jogos */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🏀 Jogos da Noite ({games.length})</h3>
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
                      JOGO {index + 1}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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
                      placeholder="Time Visitante *"
                      required
                    />
                    <input
                      type="text"
                      value={game.homeTeam}
                      onChange={(e) => updateGame(game.id, 'homeTeam', e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Time Mandante *"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={game.broadcasts.primeVideo}
                        onChange={(e) => updateGame(game.id, 'broadcast_primeVideo', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-sm">🎬 Prime Video</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={game.broadcasts.espn}
                        onChange={(e) => updateGame(game.id, 'broadcast_espn', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-sm">📺 ESPN Brasil</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={game.broadcasts.leaguePass}
                        onChange={(e) => updateGame(game.id, 'broadcast_leaguePass', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-sm">🌐 League Pass</span>
                    </label>
                  </div>
                </div>
              ))}
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