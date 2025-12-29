"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Save, Eraser, Loader2, Image as ImageIcon } from 'lucide-react';
import removeBackground from "@imgly/background-removal";
import { cn } from '@/lib/utils';

interface LogoSettingsProps {
    initialLogoUrl: string | null;
    onSave: (newUrl: string) => void;
}

export default function LogoSettings({ initialLogoUrl, onSave }: LogoSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(initialLogoUrl);

  useEffect(() => {
    setPreviewLogo(initialLogoUrl);
  }, [initialLogoUrl]);

  const handleRemoveBackground = async () => {
    let imageSource: File | Blob | string | null = logoFile;
    if (!imageSource && previewLogo) imageSource = previewLogo;

    if (!imageSource) {
        toast.error("Nenhuma imagem selecionada para remover o fundo.");
        return;
    }

    setProcessingBg(true);
    const toastId = toast.loading("Removendo fundo com IA...");

    try {
        // O blob retornado é sempre PNG (transparente)
        // Cast para any para resolver erro de assinatura de chamada no TS
        const blob = await (removeBackground as any)(imageSource);
        const newFile = new File([blob], "logo-sem-fundo.png", { type: "image/png" });
        
        setLogoFile(newFile);
        setPreviewLogo(URL.createObjectURL(newFile));
        toast.success("Fundo removido! Clique em Salvar para aplicar.", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Erro ao processar imagem. Tente outra.", { id: toastId });
    } finally {
        setProcessingBg(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setLogoFile(file);
        setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!logoFile) {
        toast.info("Nenhuma alteração de arquivo para salvar.");
        return;
    }
    
    setLoading(true);
    const toastId = toast.loading("Salvando novo logo...");
    
    try {
      const fileName = `logo-${Date.now()}.png`;
      // Usando o bucket 'article-images' que já existe
      const { error: uploadError } = await supabase.storage.from('article-images').upload(fileName, logoFile, { upsert: true });
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('article-images').getPublicUrl(fileName);
      
      if (!data.publicUrl) throw new Error("Falha ao obter URL pública.");
      
      onSave(data.publicUrl); // Chama a função de callback para atualizar o DB
      setLogoFile(null); // Limpa o arquivo local
      toast.success("Logo atualizado com sucesso!", { id: toastId });
      
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#00bfff]"/> Logo do Jogo</h3>
        <p className="text-sm text-gray-400 mb-4">Imagem principal exibida na tela inicial do Quiz. Use o removedor de fundo para um visual profissional.</p>
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Preview com fundo quadriculado */}
            <div className="relative w-full max-w-xs h-40 bg-[url('https://duodunk.com.br/images/transparent-grid.png')] bg-repeat rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {previewLogo ? (
                    <img src={previewLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                ) : <span className="text-gray-500 text-sm">Sem logo</span>}
            </div>

            <div className="flex flex-col gap-3 w-full">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold text-center flex items-center justify-center">
                    <Upload className="w-4 h-4 inline mr-2" /> Escolher Arquivo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                <button 
                    onClick={handleRemoveBackground}
                    disabled={processingBg || (!logoFile && !initialLogoUrl)}
                    className={cn(
                        "bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center",
                        processingBg && "bg-purple-800"
                    )}
                >
                    {processingBg ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Eraser className="w-4 h-4 inline mr-2" />}
                    Remover Fundo (IA)
                </button>
                
                <button 
                    onClick={handleSave} 
                    disabled={loading || !logoFile}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save />} Salvar Novo Logo
                </button>
            </div>
        </div>
    </div>
  );
}