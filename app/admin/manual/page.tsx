"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Upload, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { clearAllFeaturedArticlesServer } from '@/services/adminActions';
import Link from 'next/link';

export default function AdminManual() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    title: 'Artigo de Teste - Conexão Supabase OK',
    subtitle: 'Teste de publicação manual para verificar o SSR',
    summary: 'Este é um artigo de teste para confirmar que a conexão do servidor com o Supabase está funcionando e que os dados aparecem na Home Page.',
    body: '<p>Se você está lendo isso, a conexão SSR está funcionando corretamente!</p><h2>Próximos Passos</h2><p>Agora podemos focar na automação da IA.</p>',
    image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=630&fit=crop',
    tags: 'nba, teste, conexao',
    video_url: '',
    is_featured: true,
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens!');
      return;
    }

    const toastId = toast.loading("Fazendo upload da imagem...");
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `public/manual-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Imagem enviada com sucesso!', { id: toastId });
    } catch (error: any) {
      toast.error('Erro ao fazer upload', { id: toastId, description: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

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

      if (form.is_featured) {
        await clearAllFeaturedArticlesServer();
      }

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
        views: 0,
        video_url: form.video_url || null,
        is_featured: form.is_featured || false,
        image_focal_point: '50% 50%',
        image_focal_point_mobile: '50%',
      });

      if (error) throw error;

      toast.success('Notícia publicada com sucesso!', { id: toastId });
      router.push('/admin');
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
        <Link
          href="/admin"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Admin
        </Link>

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
              placeholder={`<p>Escreva o conteúdo completo da notícia aqui...</p>\n\n<h2>Título do Parágrafo</h2>\n<p>Conteúdo do parágrafo com título.</p>`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.body.length} caracteres. Use tags HTML como &lt;h2&gt; ou &lt;h3&gt; para títulos de seção.
            </p>
          </div>

          {/* Campo de Vídeo (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🎬 Vídeo (Opcional) - YouTube, Twitter ou Instagram
            </label>
            <input
              type="url"
              value={form.video_url || ''}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://... (YouTube, Twitter ou Instagram)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
            />
            <p className="mt-2 text-xs text-gray-400">
              Cole o link do YouTube, Twitter ou Instagram. O vídeo aparecerá no topo da notícia.
            </p>
          </div>

          {/* Imagem */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Imagem da Notícia (opcional)
            </label>
            
            {form.image_url && (
              <div className="mb-4">
                <img src={form.image_url} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
                placeholder="Cole a URL da imagem aqui..."
              />
              
              <input
                type="file"
                id="manual-image-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploadingImage}
              />
              <label
                htmlFor="manual-image-upload"
                className={`flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 transition cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload</span>
                  </>
                )}
              </label>
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
          
          {/* Marcar como Destaque */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <input
              type="checkbox"
              id="featured-manual"
              checked={form.is_featured || false}
              onChange={(e) => setForm({ 
                ...form, 
                is_featured: e.target.checked 
              })}
              className="w-5 h-5 rounded border-gray-600 text-pink-600 focus:ring-pink-500 focus:ring-offset-gray-900 cursor-pointer"
            />
            <label htmlFor="featured-manual" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-white">Marcar como Destaque</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Notícias em destaque aparecem no topo da página inicial
              </p>
            </label>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
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