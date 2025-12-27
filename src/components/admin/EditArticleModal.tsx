"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, Edit, Loader2, Save, Upload, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle, getHorizontalFocalPoint, getVerticalFocalPoint, slugify } from '@/lib/utils';

interface EditArticleModalProps {
  article: any;
  isOpen: boolean;
  isLoading: boolean;
  uploadingImage: string | null;
  onClose: () => void;
  onSave: (article: any) => void;
  onApprove: (article: any) => void;
  onImageUpload: (articleId: string, file: File) => void;
}

export default function EditArticleModal({ article, isOpen, isLoading, uploadingImage, onClose, onSave, onApprove, onImageUpload }: EditArticleModalProps) {
  const [editedArticle, setEditedArticle] = useState<any>(null);

  // Inicializa o estado apenas quando o ID do artigo mudar ou o modal abrir
  useEffect(() => {
    if (article && isOpen) {
      // Só resetamos o estado interno se o artigo for diferente do que estamos editando
      if (!editedArticle || editedArticle.id !== article.id) {
        setEditedArticle({
          ...article,
          subtitle: article.subtitle || '',
          author: article.author || 'Duo Dunk Redação',
          image_focal_point: article.image_focal_point || '50% 50%',
          image_focal_point_mobile: article.image_focal_point_mobile || '50%',
          slug: article.slug || slugify(article.title || '')
        });
      }
    } else if (!isOpen) {
      setEditedArticle(null);
    }
  }, [article, isOpen]);

  if (!isOpen || !editedArticle) return null;
  
  // Handlers para o Slider
  const handleDesktopChange = (value: number[]) => {
    const newX = `${value[0]}%`;
    const currentY = getVerticalFocalPoint(editedArticle.image_focal_point);
    setEditedArticle(prev => ({ ...prev, image_focal_point: `${newX} ${currentY}%` }));
  };

  const handleMobileChange = (value: number[]) => {
    const newY = `${value[0]}%`;
    setEditedArticle(prev => ({ ...prev, image_focal_point_mobile: newY }));
  };

  const handleTitleChange = (newTitle: string) => {
    setEditedArticle(prev => ({ 
      ...prev, 
      title: newTitle,
      // Se não tiver slug ou for um rascunho da fila, atualiza o slug junto com o título
      slug: slugify(newTitle)
    }));
  };
  
  // Valores para o Slider
  const currentHorizontalFocalPoint = getHorizontalFocalPoint(editedArticle.image_focal_point);
  const currentMobileFocalPoint = getVerticalFocalPoint(editedArticle.image_focal_point_mobile);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700 shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center z-20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-oswald uppercase"><Edit className="w-6 h-6 text-blue-400" />Editar Artigo (Fila)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Título</label>
                <input 
                  type="text" 
                  value={editedArticle.title} 
                  onChange={(e) => handleTitleChange(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white font-oswald uppercase font-bold" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Autor</label>
                <input 
                  type="text" 
                  value={editedArticle.author} 
                  onChange={(e) => setEditedArticle({ ...editedArticle, author: e.target.value })} 
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">URL Amigável (Slug)</label>
              <input 
                type="text" 
                value={editedArticle.slug} 
                onChange={(e) => setEditedArticle({ ...editedArticle, slug: e.target.value })} 
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-cyan-400 font-mono text-xs" 
                placeholder="slug-do-artigo"
              />
              <p className="text-[10px] text-gray-500 mt-1 italic">Dica: O slug é gerado automaticamente a partir do título.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Subtítulo (Interno)</label>
            <textarea value={editedArticle.subtitle} onChange={(e) => setEditedArticle({ ...editedArticle, subtitle: e.target.value })} rows={2} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white resize-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Resumo (Cards da Home)</label>
            <textarea value={editedArticle.summary} onChange={(e) => setEditedArticle({ ...editedArticle, summary: e.target.value })} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white resize-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Conteúdo (HTML)</label>
            <textarea value={editedArticle.body} onChange={(e) => setEditedArticle({ ...editedArticle, body: e.target.value })} rows={10} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white resize-none font-mono text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Vídeo URL (Opcional)</label>
              <input type="url" value={editedArticle.video_url || ''} onChange={(e) => setEditedArticle({ ...editedArticle, video_url: e.target.value })} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm" placeholder="YouTube, Twitter ou Instagram" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Tags (Separadas por vírgula)</label>
              <input type="text" value={Array.isArray(editedArticle.tags) ? editedArticle.tags.join(', ') : ''} onChange={(e) => setEditedArticle({ ...editedArticle, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h4 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-widest">Ajustes de Imagem</h4>
            
            <div className="flex flex-col md:flex-row gap-6">
               <div className="w-full md:w-1/2">
                  <label className="block text-xs font-bold text-gray-500 mb-2">PREVIEW 16:9 (DESKTOP)</label>
                  {editedArticle.image_url && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-gray-600">
                      <img src={editedArticle.image_url} alt="Preview" className="w-full h-full object-cover" style={getObjectPositionStyle(editedArticle.image_focal_point)} />
                    </div>
                  )}
               </div>
               <div className="w-full md:w-1/2">
                  <label className="block text-xs font-bold text-gray-500 mb-2">PREVIEW 3:4 (MOBILE)</label>
                  {editedArticle.image_url && (
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-black border border-gray-600 max-h-48 mx-auto">
                      <img src={editedArticle.image_url} alt="Preview Mobile" className="w-full h-full object-cover" style={getObjectPositionStyle(editedArticle.image_focal_point_mobile, true)} />
                    </div>
                  )}
               </div>
            </div>

            <div className="mt-6 flex gap-4 items-center">
              <input type="url" value={editedArticle.image_url || ''} onChange={(e) => setEditedArticle({ ...editedArticle, image_url: e.target.value })} className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-400" placeholder="URL da Imagem" />
              <input type="file" id="modal-image-upload" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(editedArticle.id, file); }} disabled={uploadingImage === editedArticle.id} />
              <label htmlFor="modal-image-upload" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer font-bold text-sm">
                <Upload className="w-4 h-4" /> {uploadingImage === editedArticle.id ? 'Carregando...' : 'Trocar Imagem'}
              </label>
            </div>
            
            <div className="mt-8 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Foco Vertical Mobile</label>
                  <span className="text-xs text-blue-400 font-mono">{currentMobileFocalPoint}%</span>
                </div>
                <Slider value={[currentMobileFocalPoint]} onValueChange={handleMobileChange} max={100} step={1} className="w-full" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Foco Horizontal Desktop</label>
                  <span className="text-xs text-blue-400 font-mono">{currentHorizontalFocalPoint}%</span>
                </div>
                <Slider value={[currentHorizontalFocalPoint]} onValueChange={handleDesktopChange} max={100} step={1} className="w-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex flex-col md:flex-row justify-end gap-3 sticky bottom-0 z-20">
          <button onClick={onClose} className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 hover:text-white transition-colors font-bold text-sm order-3 md:order-1">Cancelar</button>
          <button onClick={() => onSave(editedArticle)} disabled={isLoading} className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-sm px-10 order-1 md:order-2">
            {isLoading ? (<Loader2 className="w-5 h-5 animate-spin" />) : (<Save className="w-5 h-5" />)} 
            Salvar Edição
          </button>
          <button onClick={() => onApprove(editedArticle)} disabled={isLoading} className="btn-success flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-sm px-10 order-2 md:order-3">
            <CheckCircle className="w-5 h-5" /> Aprovar & Publicar
          </button>
        </div>
      </div>
    </div>
  );
}