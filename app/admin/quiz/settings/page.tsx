'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Save, Eraser, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import removeBackground from "@imgly/background-removal";
import { cn } from '@/lib/utils'; // Mantendo o cn

// Interface para as configurações visuais (simplificada para esta página)
interface QuizSettings {
  logo_url: string | null;
  victory_image_url: string | null;
  defeat_image_url: string | null;
  cards_image_url: string | null;
  rookies_image_url: string | null;
}

export default function QuizSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    logo_url: null,
    victory_image_url: null,
    defeat_image_url: null,
    cards_image_url: null,
    rookies_image_url: null,
  });
  
  // Estados para arquivos locais (preview antes de salvar)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('quiz_settings').select('*').eq('id', 1).single();
    if (data) {
        setSettings(data);
        setPreviewLogo(data.logo_url);
    }
  }

  // --- MÁGICA: REMOVER FUNDO ---
  const handleRemoveBackground = async () => {
    // Usa o arquivo selecionado OU a imagem atual (convertendo URL para Blob)
    let imageSource: File | Blob | string | null = logoFile;

    if (!imageSource && settings.logo_url) {
        imageSource = settings.logo_url; // A lib aceita URL
    }

    if (!imageSource) {
        toast.error("Nenhuma imagem selecionada para processar.");
        return;
    }

    setProcessingBg(true);
    const toastId = toast.loading("A IA está removendo o fundo... (Isso pode levar alguns segundos)");

    try {
        // Processamento pesado no navegador
        const blob = await removeBackground(imageSource);
        
        // Criar novo arquivo PNG transparente
        const newFile = new File([blob], "logo-sem-fundo.png", { type: "image/png" });
        
        // Atualizar estado
        setLogoFile(newFile);
        setPreviewLogo(URL.createObjectURL(newFile));
        
        toast.success("Fundo removido com sucesso!", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Falha ao remover fundo. Tente uma imagem mais simples.", { id: toastId });
    } finally {
        setProcessingBg(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof QuizSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      
      if (field === 'logo_url') {
          setLogoFile(file);
          setPreviewLogo(url);
      } else {
          // Para as outras imagens, atualiza o estado local para upload futuro
          setSettings(prev => ({ ...prev, [field]: url }));
          // Não precisamos de um estado File separado para as outras, pois o hook useQuizSettings já lida com o upload
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const toastId = toast.loading("Salvando configurações...");

    try {
      let logoUrl = settings.logo_url;

      // 1. Upload do Logo se mudou (prioriza o arquivo local, mesmo que seja o sem fundo)
      if (logoFile) {
        const fileName = `logo-${Date.now()}.png`;
        const { error } = await supabase.storage.from('article-images').upload(fileName, logoFile, { upsert: true });
        if (error) throw error;
        
        // Pegar URL pública
        const { data: publicData } = supabase.storage.from('article-images').getPublicUrl(fileName);
        logoUrl = publicData.publicUrl;
      }

      // 2. Atualizar Tabela (Apenas o logo por enquanto, o resto é feito pelo useQuizSettings)
      const { error: dbError } = await supabase.from('quiz_settings').update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      if (dbError) throw dbError;

      toast.success("Configurações salvas!", { id: toastId });
      loadSettings(); // Recarregar
      setLogoFile(null);

    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  // Componente auxiliar para as outras imagens (mantendo a estrutura original)
  const ImageUploadCard = ({ fieldName, label, description }: { fieldName: keyof QuizSettings, label: string, description: string }) => {
    const currentUrl = settings[fieldName];
    const [uploadingLocal, setUploadingLocal] = useState(false);

    const handleLocalUpload = async (file: File) => {
        setUploadingLocal(true);
        const toastId = toast.loading(`Fazendo upload de ${label}...`);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${fieldName}-${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('article-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('article-images')
                .getPublicUrl(filePath);

            if (!data.publicUrl) throw new Error("URL da imagem não encontrada.");

            const { error: updateError } = await supabase
                .from('quiz_settings')
                .update({ [fieldName]: data.publicUrl, updated_at: new Date().toISOString() })
                .eq('id', 1);

            if (updateError) throw updateError;

            setSettings(prev => ({ ...prev, [fieldName]: data.publicUrl }));
            toast.success('Imagem atualizada com sucesso!', { id: toastId });
        } catch (error: any) {
            toast.error('Erro ao fazer upload', { id: toastId, description: error.message });
        } finally {
            setUploadingLocal(false);
        }
    };

    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        
        {currentUrl && (
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-900">
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          </div>
        )}

        <input
          type="file"
          id={`upload-${fieldName}`}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLocalUpload(file);
          }}
          disabled={uploadingLocal}
        />
        <label
          htmlFor={`upload-${fieldName}`}
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
            uploadingLocal ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-400' : 'border-[#ff00ff]/50 text-[#ff00ff] hover:bg-[#ff00ff]/10'
          )}
        >
          {uploadingLocal ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>{currentUrl ? 'Trocar Imagem' : 'Fazer Upload'}</span>
            </>
          )}
        </label>
        <p className="text-xs text-gray-500 mt-2 truncate">URL Atual: {currentUrl || 'N/D'}</p>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/quiz" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" /> Voltar para Quiz Admin
        </Link>

        <h1 className="text-4xl font-bebas mb-8 text-white border-b pb-4 border-gray-700 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-[#00bfff]" /> Configurações Visuais do Quiz
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SEÇÃO LOGO (Com Remoção de Fundo) */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 md:col-span-2">
                <h3 className="text-xl font-bold text-white mb-2">Logo do Jogo (Tela Inicial)</h3>
                <p className="text-sm text-gray-400 mb-4">Faça upload do logo e use a IA para remover o fundo automaticamente.</p>
                
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Preview Area */}
                    <div className="relative w-64 h-40 bg-[url('https://duodunk.com.br/images/transparent-grid.png')] bg-repeat rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {previewLogo ? (
                            <img src={previewLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-gray-500 text-sm">Sem logo</span>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-bold justify-center">
                            <Upload className="w-4 h-4" /> Escolher Arquivo
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo_url')} />
                        </label>

                        <button 
                            onClick={handleRemoveBackground}
                            disabled={processingBg || (!logoFile && !settings.logo_url)}
                            className="flex items-center gap-2 cursor-pointer bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition text-sm font-bold justify-center"
                        >
                            {processingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
                            {processingBg ? 'Processando IA...' : '✨ Remover Fundo (IA)'}
                        </button>
                        
                        <p className="text-xs text-gray-400 mt-2">
                            *Dica: Use a IA para deixar o logo transparente automaticamente.
                        </p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 truncate">URL Atual: {settings.logo_url || 'N/D'}</p>
            </div>
            
            {/* Outras Imagens (Usando o componente auxiliar) */}
            <ImageUploadCard 
                fieldName="victory_image_url" 
                label="Imagem da Vitória (R$ 1 Milhão)" 
                description="Imagem exibida quando o jogador ganha o prêmio máximo."
            />
            <ImageUploadCard 
                fieldName="defeat_image_url" 
                label="Imagem da Derrota/Eliminação" 
                description="Imagem exibida quando o jogador erra ou o tempo acaba."
            />
            <ImageUploadCard 
                fieldName="cards_image_url" 
                label="Verso das Cartas (Ajuda)" 
                description="Imagem usada como fundo para a ajuda 'Cartas'."
            />
            <ImageUploadCard 
                fieldName="rookies_image_url" 
                label="Opinião dos Rookies (Ajuda)" 
                description="Imagem usada como fundo para a ajuda 'Rookies'."
            />
        </div>
        
        <div className="border-t border-gray-700 pt-6 mt-6">
            <button 
                onClick={handleSave} 
                disabled={loading || processingBg}
                className="w-full md:w-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg shadow-green-900/20"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Save />}
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
}