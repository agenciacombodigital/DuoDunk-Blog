import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Loader2, Upload, Star, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminRodadaNBA() {
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=630&fit=crop');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [intro, setIntro] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);

  const handleImageUpload = async (file: File) => {
    try {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato de imagem inválido. Use JPEG, PNG ou WEBP.');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Imagem muito grande. Tamanho máximo: 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `rodada-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setError(null);
    const toastId = toast.loading('Publicando rodada...');

    try {
      if (!imageFile) throw new Error('Selecione uma imagem de capa para a rodada.');
      if (!title.trim()) throw new Error('O título da rodada é obrigatório.');
      if (!intro.trim()) throw new Error('O conteúdo da rodada é obrigatório.');

      const imageUrl = await handleImageUpload(imageFile);
      if (!imageUrl) throw new Error('Falha ao obter URL da imagem após o upload.');

      const dateObj = new Date(`${date}T12:00:00Z`);
      const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

      let body = '<div class="schedule-post" style="font-family: system-ui, -apple-system, sans-serif;">';
      
      if (customSummary.trim()) {
        body += `<p style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 20px;">${customSummary.trim()}</p>`;
      }
      
      const paragraphs = intro.split('\n').map(p => `<p style="color: #333; line-height: 1.8; margin: 0 0 15px 0;">${p}</p>`).join('');
      body += `<div style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px; border-left: 4px solid #e91e63;">${paragraphs}</div>`;
      body += '<div style="margin-top: 30px; padding: 15px; background: #fff3f8; border-left: 4px solid #e91e63; border-radius: 4px;"><p style="margin: 0; color: #666; font-size: 14px;"><strong>💬 Participe!</strong> Deixe seu comentário e palpite para os jogos de hoje!</p></div>';
      body += '</div>';

      const slug = `rodada-nba-${dateStr.replace(/\//g, '-')}-${Date.now()}`;

      const { error: insertError } = await supabase.from('articles').insert({
        title: title.trim(),
        subtitle: subtitle.trim() || `Confira os jogos, horários e transmissões`,
        summary: '', 
        body,
        slug,
        meta_description: customSummary.substring(0, 160) || title.substring(0, 160),
        tags: ['nba', 'rodada', 'jogos-de-hoje', 'horarios', 'onde-assistir'],
        image_url: imageUrl,
        source: 'DuoDunk - Rodada NBA',
        published: true,
        published_at: new Date().toISOString(),
        views: 0,
        is_featured: isFeatured,
      });

      if (insertError) throw insertError;

      toast.success('Post de rodada criado com sucesso!', { id: toastId });
      navigate('/admin');

    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      toast.error('Erro ao criar post', { id: toastId, description: errorMessage });
    } finally {
      setIsPublishing(false);
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
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              ✨ Resumo do Artigo (Máx. 2 linhas)
            </label>
            <textarea
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none"
              placeholder="Breve introdução para a página do artigo (não aparece na imagem de destaque da Home)."
            />
            <p className="text-xs text-gray-500 mt-1">{customSummary.length}/200 caracteres</p>
          </div>

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

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <label className="block text-sm font-medium mb-2">
              🖼️ Imagem da Capa *
            </label>
            <input
              type="file"
              id="rodada-image-upload"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isPublishing}
            />
            <label
              htmlFor="rodada-image-upload"
              className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-xl hover:border-pink-500 transition-colors cursor-pointer ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-400">
                {imageFile ? `Arquivo: ${imageFile.name}` : 'Selecionar imagem (Max 5MB)'}
              </span>
            </label>
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="mt-3 w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>
          
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {isPublishing ? (
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