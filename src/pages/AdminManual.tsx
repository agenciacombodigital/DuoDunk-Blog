import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

export default function AdminManual() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    summary: '',
    body: '',
    image_url: '',
    tags: 'nba, basquete',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Publicando notícia...");

    try {
      // Gerar slug
      const slug = form.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      // Inserir direto na tabela articles (publicar)
      const { error } = await supabase.from('articles').insert({
        title: form.title,
        subtitle: form.subtitle,
        summary: form.summary,
        body: form.body,
        image_url: form.image_url || null,
        tags: form.tags.split(',').map(t => t.trim()),
        slug,
        meta_description: form.summary.substring(0, 160),
        published: true,
        published_at: new Date().toISOString(),
        source: 'Editorial DuoDunk',
        original_link: null,
        views: 0
      });

      if (error) throw error;

      toast.success('Notícia publicada com sucesso!', { id: toastId });
      navigate('/admin');
    } catch (error: any) {
      toast.error('Erro ao publicar', { id: toastId, description: error.message });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Admin
        </button>

        <h1 className="text-3xl font-bold mb-2">✍️ Publicação Manual</h1>
        <p className="text-gray-400 mb-8">
          Crie e publique notícias próprias de forma manual
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Título da Notícia *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
              placeholder="Ex: Lakers vencem Warriors em jogo emocionante"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.title.length}/80 caracteres
            </p>
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Subtítulo (opcional)
            </label>
            <input
              type="text"
              maxLength={100}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
              placeholder="Ex: LeBron James marca 35 pontos na vitória por 112-105"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.subtitle.length}/100 caracteres
            </p>
          </div>

          {/* Resumo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Resumo *
            </label>
            <textarea
              required
              maxLength={240}
              rows={3}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
              placeholder="Breve resumo da notícia (200-240 caracteres)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.summary.length}/240 caracteres
            </p>
          </div>

          {/* Corpo do Texto */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Texto Completo (HTML) *
            </label>
            <textarea
              required
              rows={15}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
              placeholder="<p>Escreva o conteúdo completo da notícia aqui...</p>"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.body.length} caracteres
            </p>
          </div>

          {/* URL da Imagem */}
          <div>
            <label className="block text-sm font-medium mb-2">
              URL da Imagem (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <button
                type="button"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 transition"
                title="Upload de imagem (em breve)"
                disabled
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
              placeholder="nba, basquete, lakers, lebron"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe cada tag com vírgula. Ex: nba, playoffs, warriors
            </p>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Publicar Notícia
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}