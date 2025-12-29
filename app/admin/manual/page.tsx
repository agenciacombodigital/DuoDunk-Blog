"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Upload, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { clearAllFeaturedArticlesServer } from '@/services/adminActions';
import { optimizeImageForOG } from '@/utils/imageProcessing';
import Link from 'next/link';

export default function AdminManual() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    summary: '',
    body: '',
    image_url: '',
    tags: '',
    video_url: '',
    is_featured: true,
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens!');
      return;
    }

    const toastId = toast.loading("Otimizando imagem...");
    setUploadingImage(true);
    try {
      const optimizedBlob = await optimizeImageForOG(file);
      const optimizedFile = new File([optimizedBlob], `manual-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const fileName = `public/manual-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, optimizedFile, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Imagem preparada!', { id: toastId });
    } catch (error: any) {
      toast.error('Erro no processamento', { id: toastId, description: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Publicando...");

    try {
      const slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
      if (form.is_featured) await clearAllFeaturedArticlesServer();

      const { error } = await supabase.from('articles').insert({
        title: form.title,
        subtitle: form.subtitle || null,
        summary: form.summary,
        body: form.body,
        image_url: form.image_url || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
        slug,
        meta_description: form.summary.substring(0, 160),
        published: true,
        published_at: new Date().toISOString(),
        source: 'Editorial DuoDunk',
        author: 'Fernando Balley',
        is_featured: form.is_featured || false,
        image_focal_point: '50% 50%',
        image_focal_point_mobile: '50%',
      });

      if (error) throw error;
      toast.success('Publicado!', { id: toastId });
      router.push('/admin');
    } catch (error: any) {
      toast.error('Erro', { id: toastId, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"><ArrowLeft className="w-5 h-5" />Voltar</Link>
        <h1 className="text-3xl font-bold mb-8">✍️ Publicação Manual</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Título *</label>
            <input type="text" required maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-pink-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Resumo *</label>
            <textarea required maxLength={240} rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-pink-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Corpo (HTML) *</label>
            <textarea required rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-pink-500 outline-none font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Imagem</label>
            {form.image_url && <img src={form.image_url} className="mb-4 h-48 w-full object-cover rounded-lg" />}
            <div className="flex gap-2">
              <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3" placeholder="URL ou upload..." />
              <input type="file" id="manual-image-upload" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} />
              <label htmlFor="manual-image-upload" className="bg-gray-800 border border-gray-700 px-6 py-3 rounded-lg cursor-pointer hover:bg-gray-700">{uploadingImage ? <Loader2 className="animate-spin" /> : <Upload />}</label>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <input type="checkbox" id="featured-manual" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-5 h-5 rounded text-pink-600" />
            <label htmlFor="featured-manual" className="font-bold">Marcar como Destaque</label>
          </div>
          <button type="submit" disabled={loading || uploadingImage} className="w-full bg-pink-600 py-4 rounded-lg font-bold flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" /> : <Save />} Publicar</button>
        </form>
      </div>
    </div>
  );
}