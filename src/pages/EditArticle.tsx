import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Save, X, Upload, Trash2, ArrowLeft, Loader2, Star } from 'lucide-react';
import { toast } from "sonner";
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle, getHorizontalFocalPoint, getVerticalFocalPoint, slugify } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { clearAllFeaturedArticles } from '@/lib/adminUtils';
// import { requestGoogleIndexing } from '@/services/indexingService'; // Importando o serviço de indexação

export default function EditArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    body: '',
    image_url: '',
    meta_description: '',
    tags: [] as string[],
    video_url: '',
    image_focal_point: '50% 50%',
    image_focal_point_mobile: '50%',
    is_featured: false,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    loadArticle();
  }, [slug, navigate, isAdmin]);

  const loadArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      setArticle(data);
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        summary: data.summary || '',
        body: data.body || '',
        image_url: data.image_url || '',
        meta_description: data.meta_description || '',
        tags: data.tags || [],
        video_url: data.video_url || '',
        image_focal_point: data.image_focal_point || '50% 50%', 
        image_focal_point_mobile: data.image_focal_point_mobile || '50%',
        is_featured: data.is_featured || false,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar artigo', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens!');
      return;
    }

    const toastId = toast.loading("Fazendo upload da imagem...");
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `public/${article.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Imagem atualizada com sucesso!', { id: toastId });
    } catch (error: any) {
      toast.error('Erro ao fazer upload', { id: toastId, description: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Título e conteúdo são obrigatórios!');
      return;
    }
    
    const finalSlug = slugify(formData.slug || formData.title);

    setSaving(true);
    const toastId = toast.loading("Salvando alterações...");
    try {
      if (formData.is_featured && !article.is_featured) {
        await clearAllFeaturedArticles();
      }

      const { error } = await supabase
        .from('articles')
        .update({
          title: formData.title,
          slug: finalSlug,
          summary: formData.summary,
          body: formData.body,
          image_url: formData.image_url,
          meta_description: formData.meta_description,
          tags: formData.tags,
          video_url: formData.video_url,
          image_focal_point: formData.image_focal_point,
          image_focal_point_mobile: formData.image_focal_point_mobile,
          is_featured: formData.is_featured,
        })
        .eq('id', article.id);

      if (error) throw error;

      toast.success('Artigo atualizado com sucesso!', { id: toastId });
      
      // 🚀 Solicitar Indexação (REMOVIDO: Agora é feito via trigger do Supabase)
      // await requestGoogleIndexing([`/artigos/${finalSlug}`]);
      
      // ✅ CORREÇÃO: Sempre navega para o painel de administração após salvar
      navigate('/admin');
      
    } catch (error: any) {
      toast.error('Erro ao salvar', { id: toastId, description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmText = prompt(
      '⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n' +
      'Digite "DELETAR" para confirmar:'
    );

    if (confirmText !== 'DELETAR') {
      toast.info('Operação cancelada.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Deletando artigo...");
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', article.id);

      if (error) throw error;

      toast.success('Artigo deletado com sucesso!', { id: toastId });
      navigate('/admin');
    } catch (error: any) {
      toast.error('Erro ao deletar', { id: toastId, description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const currentHorizontalFocalPoint = getHorizontalFocalPoint(formData.image_focal_point);
  const currentMobileFocalPoint = getVerticalFocalPoint(formData.image_focal_point_mobile);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-oswald uppercase">Editar Notícia</h1>
                <p className="text-sm text-gray-400 mt-1 font-inter">
                  Publicado em {new Date(article.published_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="btn-danger flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
                Deletar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Título da Notícia
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg font-oswald uppercase font-bold"
                placeholder="Digite o título..."
              />
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Slug (URL)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                onBlur={() => setFormData(prev => ({ ...prev, slug: slugify(prev.slug || prev.title) }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm font-mono"
                placeholder="slug-da-noticia"
              />
              <p className="text-xs text-gray-500 mt-2 font-inter">
                URL atual: <span className="text-cyan-400 break-all">/artigos/{formData.slug}</span>
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Resumo
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none font-inter"
                placeholder="Escreva um resumo atrativo..."
              />
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Conteúdo Completo (HTML)
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                rows={20}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none font-mono text-sm font-inter"
                placeholder="<p>Parágrafo 1.</p><p>Parágrafo 2.</p>"
              />
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                🎬 Vídeo (Opcional) - YouTube, Twitter ou Instagram
              </label>
              <input
                type="url"
                value={formData.video_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-inter"
                placeholder="https://... (YouTube, Twitter ou Instagram)"
              />
              <p className="text-xs text-gray-500 mt-2 font-inter">
                Se preenchido, o vídeo substituirá a imagem de destaque.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-4 font-inter">
                Imagem de Destaque
              </label>

              {formData.image_url && (
                <div className="relative mb-4 rounded-xl overflow-hidden aspect-video">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={getObjectPositionStyle(formData.image_focal_point)}
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploadingImage}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-xl hover:border-pink-500 transition-colors cursor-pointer ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                    <span className="text-sm font-semibold text-gray-400 font-inter">Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-400 font-inter">
                      {formData.image_url ? 'Trocar Imagem' : 'Upload de Imagem'}
                    </span>
                  </>
                )}
              </label>
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                  Foco Vertical (Mobile 3:4)
                </label>
                <div className="relative mb-4 rounded-xl overflow-hidden aspect-[3/4] border-2 border-pink-500/50 mt-2 max-h-96 mx-auto max-w-xs">
                  <img
                    src={formData.image_url}
                    alt="Preview Mobile"
                    className="w-full h-full object-cover"
                    style={getObjectPositionStyle(formData.image_focal_point_mobile, true)}
                  />
                  <div className="absolute inset-0 border-4 border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                    <span className="text-white text-xs bg-black/50 p-1 rounded font-inter">Corte Mobile (3:4)</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400 font-inter">Topo</span>
                  <Slider
                    value={[currentMobileFocalPoint]}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, image_focal_point_mobile: `${value[0]}%` }));
                    }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400 font-inter">Baixo</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-inter">
                  Ajuste para garantir que o assunto principal apareça no corte vertical (3:4) da Home.
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                  Foco Horizontal (Desktop 16:9)
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400 font-inter">Esquerda</span>
                  <Slider
                    value={[currentHorizontalFocalPoint]}
                    onValueChange={(value) => {
                      const currentVertical = getVerticalFocalPoint(formData.image_focal_point);
                      setFormData(prev => ({ ...prev, image_focal_point: `${value[0]}% ${currentVertical}%` }));
                    }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400 font-inter">Direita</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-inter">
                  Ajuste para garantir que o assunto principal apareça no corte horizontal (16:9).
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm font-inter"
                placeholder="nba, basquete, lakers..."
              />
              <p className="text-xs text-gray-500 mt-2 font-inter">
                Separe as tags por vírgula
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Meta Description (SEO)
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-sm font-inter"
                placeholder="Descrição para mecanismos de busca..."
              />
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured-edit"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-pink-600 focus:ring-pink-500 focus:ring-offset-gray-900 cursor-pointer"
                />
                <label htmlFor="featured-edit" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Star className={`w-5 h-5 text-yellow-500 ${formData.is_featured ? 'fill-yellow-500' : ''}`} />
                    <span className="font-bold text-white">Marcar como Destaque</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Isso substituirá qualquer outra notícia em destaque.
                  </p>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}