"use client";

import { ArrowLeft, Upload, Loader2, Image as ImageIcon, Save } from 'lucide-react';
import Link from 'next/link';
import { useQuizSettings } from '@/hooks/useQuizSettings';
import { cn } from '@/lib/utils';
import LogoSettings from '@/components/admin/quiz/LogoSettings'; // Importando o novo componente
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function QuizSettingsPage() {
  const { settings, loading, uploading, handleImageUpload, loadSettings } = useQuizSettings();

  // Função de callback para o LogoSettings
  const handleLogoSave = async (newUrl: string) => {
    const toastId = toast.loading("Atualizando URL do logo no DB...");
    try {
        const { error } = await supabase
            .from('quiz_settings')
            .update({ logo_url: newUrl, updated_at: new Date().toISOString() })
            .eq('id', 1);
        
        if (error) throw error;
        
        toast.success("Logo atualizado com sucesso!", { id: toastId });
        loadSettings(); // Recarrega as settings para atualizar o estado global
    } catch (error: any) {
        toast.error("Erro ao salvar logo:", { id: toastId, description: error.message });
    }
  };

  const ImageUploadCard = ({ fieldName, label, description }: { fieldName: keyof typeof settings, label: string, description: string }) => {
    const currentUrl = settings[fieldName];
    
    // Excluímos o logo daqui, pois ele tem seu próprio componente
    if (fieldName === 'logo_url') return null; 

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
            if (file) handleImageUpload(file, fieldName);
          }}
          disabled={uploading}
        />
        <label
          htmlFor={`upload-${fieldName}`}
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
            uploading ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-400' : 'border-[#ff00ff]/50 text-[#ff00ff] hover:bg-[#ff00ff]/10'
          )}
        >
          {uploading ? (
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-[#ff00ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/admin/quiz"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Quiz Admin
        </Link>
        
        <h1 className="text-4xl font-bebas mb-8 text-white border-b pb-4 border-gray-700 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-[#00bfff]" /> Configurações Visuais do Quiz
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* NOVO COMPONENTE PARA O LOGO */}
          <LogoSettings 
            initialLogoUrl={settings.logo_url || null}
            onSave={handleLogoSave}
          />
          
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
      </div>
    </div>
  );
}