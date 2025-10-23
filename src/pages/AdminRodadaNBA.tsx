import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Loader2, Upload, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminRodadaNBA() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [intro, setIntro] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=630&fit=crop');
  const [isFeatured, setIsFeatured] = useState(true); // PADRÃO: TRUE

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens!');
      return;
    }

    const toastId = toast.loading("Fazendo upload da imagem...");
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const uniqueId = Date.now();
      const fileName = `public/rodada-${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      setImageUrl(data.publicUrl);
      toast.success('Imagem enviada com sucesso!', { id: toastId });
    } catch (error: any) {
      toast.error('Erro ao fazer upload', { id: toastId, description: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !intro) {
      toast.error('Preencha título e texto introdutório!');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Criando post de rodada...');

    try {
      const dateObj = new Date(`${date}T12:00:00Z`);
      const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

      // Criar corpo HTML a partir do texto introdutório
      let body = '<div class="schedule-post" style="font-family: system-ui, -apple-system, sans-serif;">';
      
      // Texto introdutório (agora contendo os jogos formatados pelo usuário)
      if (intro) {
        // Substituir quebras de linha por parágrafos HTML
        const paragraphs = intro.split('\n').map(p => `<p style="color: #333; line-height: 1.8; margin: 0 0 15px 0;">${p}</p>`).join('');
        
        body += `<div style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px; border-left: 4px solid #e91e63;">`;
        body += paragraphs;
        body += `</div>`;
      }

      body += '<div style="margin-top: 30px; padding: 15px; background: #fff3f8; border-left: 4px solid #e91e63; border-radius: 4px;">';
      body += '<p style="margin: 0; color: #666; font-size: 14px;"><strong>💬 Participe!</strong> Deixe seu comentário e palpite para os jogos de hoje!</p>';
      body += '</div>';
      body += '</div>';

      const slug = `rodada-nba-${dateStr.replace(/\//g, '-')}-${Date.now()}`;
      
      const summary = intro.substring(0, 240) || `Confira a rodada de hoje da NBA, horários e transmissões.`;

      const { error } = await supabase.from('articles').insert({
        title: title || `Rodada NBA - ${dateStr}`,
        subtitle: subtitle || `Confira os jogos, horários e transmissões`,
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
        views: 0,
        is_featured: isFeatured, // Adicionado
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

          {/* Texto Introdutório (Agora inclui os jogos) */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              ✍️ Conteúdo da Rodada (Inclua os jogos aqui) *
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={10}
              maxLength={2000}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
              placeholder={`Exemplo de formato:\n\nA rodada de hoje traz confrontos emocionantes...\n\n🏀 JOGOS DA NOITE\n\n20:00 (BR) - 🎬 Prime Video, 🌐 League Pass\nLakers vs Celtics\n\n22:30 (BR) - 📺 ESPN Brasil, 🌐 League Pass\nWarriors vs Suns`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{intro.length}/2000 caracteres</p>
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
              
              <input
                type="file"
                id="rodada-image-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploadingImage}
              />
              <label
                htmlFor="rodada-image-upload"
                className={`flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 transition cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </label>
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
          
          {/* Marcar como Destaque */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <input
              type="checkbox"
              id="featured-rodada"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-pink-600 focus:ring-pink-500 focus:ring-offset-gray-900 cursor-pointer"
            />
            <label htmlFor="featured-rodada" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-white">Marcar como Destaque</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                ⚡ Rodadas NBA sempre devem ser destaque para maior engajamento nos comentários!
              </p>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
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