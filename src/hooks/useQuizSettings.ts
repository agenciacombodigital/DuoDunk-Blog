"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface QuizSettings {
  logo_url: string | null;
  victory_image_url: string | null;
  defeat_image_url: string | null;
  cards_image_url: string | null;
  rookies_image_url: string | null;
}

const DEFAULT_SETTINGS: QuizSettings = {
  logo_url: '/images/duodunk-logoV2.svg',
  victory_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  defeat_image_url: 'https://images.unsplash.com/photo-1518091043521-49e79c9eb6e8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  cards_image_url: 'https://images.unsplash.com/photo-1550525811-cd15a2d95257?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  rookies_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

export function useQuizSettings() {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw error;
      }
      
      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        // Se não houver dados, insere o padrão (Admin deve ter permissão)
        await supabase.from('quiz_settings').insert({ id: 1 }).select();
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações do Quiz:', error.message);
      toast.error('Erro ao carregar configurações do Quiz.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleImageUpload = async (file: File, fieldName: keyof QuizSettings) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens!');
      return;
    }

    const toastId = toast.loading(`Fazendo upload de ${fieldName}...`);
    setUploading(true);
    try {
      // 1. Upload para o bucket 'quiz-assets'
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldName}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Verifica se o bucket existe, se não, o Supabase deve criá-lo ou falhar.
      // Assumimos que o bucket 'quiz-assets' será criado manualmente ou via política.
      // Usaremos 'article-images' por enquanto, que já existe.
      const { error: uploadError } = await supabase.storage
        .from('article-images') // Usando bucket existente
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error("URL da imagem não encontrada.");

      // 2. Atualizar a URL no banco de dados
      const { error: updateError } = await supabase
        .from('quiz_settings')
        .update({ [fieldName]: data.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (updateError) throw updateError;

      // 3. Atualizar estado local
      setSettings(prev => ({ ...prev, [fieldName]: data.publicUrl }));
      toast.success('Imagem atualizada com sucesso!', { id: toastId });
      
    } catch (error: any) {
      toast.error('Erro ao fazer upload', { id: toastId, description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return {
    settings,
    loading,
    uploading,
    handleImageUpload,
    loadSettings,
  };
}