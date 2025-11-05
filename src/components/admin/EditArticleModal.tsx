import { useState, useEffect } from 'react';
import { CheckCircle, Edit, Loader2, Save, Upload, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle } from '@/lib/utils';

const focalPointToPercentage = (focalPoint: string | null | undefined): number => {
  if (!focalPoint) return 50;
  if (focalPoint === 'top') return 0;
  if (focalPoint === 'center') return 50;
  if (focalPoint === 'bottom') return 100;
  if (focalPoint.endsWith('%')) return parseInt(focalPoint.replace('%', ''));
  return 50;
};

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
  const [editedArticle, setEditedArticle] = useState(article);

  useEffect(() => {
    setEditedArticle(article);
  }, [article]);

  if (!isOpen || !editedArticle) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700 shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-oswald uppercase"><Edit className="w-6 h-6 text-blue-400" />Editar Artigo (Fila)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">Título</label>
            <input type="text" value={editedArticle.title} onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-oswald uppercase font-bold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">Resumo</label>
            <textarea value={editedArticle.summary} onChange={(e) => setEditedArticle({ ...editedArticle, summary: e.target.value })} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-inter" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">Conteúdo (HTML)</label>
            <textarea value={editedArticle.body} onChange={(e) => setEditedArticle({ ...editedArticle, body: e.target.value })} rows={10} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm font-inter" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">Vídeo URL (Opcional)</label>
            <input type="url" value={editedArticle.video_url || ''} onChange={(e) => setEditedArticle({ ...editedArticle, video_url: e.target.value })} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter" placeholder="Link do YouTube, Twitter ou Instagram" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">Tags (separadas por vírgula)</label>
            <input type="text" value={Array.isArray(editedArticle.tags) ? editedArticle.tags.join(', ') : ''} onChange={(e) => setEditedArticle({ ...editedArticle, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-inter" />
          </div>
          
          {/* Controle de Imagem */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">Imagem de Destaque</label>
            {editedArticle.image_url && (<div className="w-full h-48 rounded-lg mb-3 overflow-hidden bg-gray-700"><img src={editedArticle.image_url} alt="Preview" className="w-full h-full object-cover" style={getObjectPositionStyle(editedArticle.image_focal_point)} /></div>)}
            <div className="flex gap-2 items-center">
              <input type="url" value={editedArticle.image_url || ''} onChange={(e) => setEditedArticle({ ...editedArticle, image_url: e.target.value })} className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-inter" placeholder="Cole a URL ou faça upload" />
              <input type="file" id="modal-image-upload" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(editedArticle.id, file); }} disabled={uploadingImage === editedArticle.id} />
              <label htmlFor="modal-image-upload" className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"><Upload className="w-5 h-5" /></label>
            </div>
            
            {/* Foco Vertical Mobile (3:4) */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Foco Vertical (Mobile 3:4)
              </label>
              <div className="relative mb-4 rounded-xl overflow-hidden aspect-[3/4] border-2 border-pink-500/50">
                <img
                  src={editedArticle.image_url}
                  alt="Preview Mobile"
                  className="w-full h-full object-cover"
                  style={getObjectPositionStyle(editedArticle.image_focal_point_mobile)}
                />
                <div className="absolute inset-0 border-4 border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                  <span className="text-white text-xs bg-black/50 p-1 rounded font-inter">Corte Mobile (3:4)</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-400 font-inter">Topo</span>
                <Slider 
                  value={[focalPointToPercentage(editedArticle.image_focal_point_mobile)]} 
                  onValueChange={(value) => { 
                    setEditedArticle({ ...editedArticle, image_focal_point_mobile: `${value[0]}%` }) 
                  }} 
                  max={100} 
                  step={1} 
                  className="w-full" 
                />
                <span className="text-xs text-gray-400 font-inter">Baixo</span>
              </div>
            </div>
            
            {/* Foco Horizontal (Desktop 16:9) */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <label className="block text-sm font-bold text-gray-300 mb-2 font-inter">
                Foco Horizontal (Desktop 16:9)
              </label>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-400 font-inter">Esquerda</span>
                <Slider 
                  value={[focalPointToPercentage(editedArticle.image_focal_point)]} 
                  onValueChange={(value) => { 
                    setEditedArticle({ ...editedArticle, image_focal_point: `${value[0]}% 50%` }) 
                  }} 
                  max={100} 
                  step={1} 
                  className="w-full" 
                />
                <span className="text-xs text-gray-400 font-inter">Direita</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold font-inter">Cancelar</button>
          <button onClick={() => onSave(editedArticle)} disabled={isLoading} className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50 font-inter">{isLoading ? (<Loader2 className="w-5 h-5 animate-spin" />) : (<Save className="w-5 h-5" />)}Salvar Edição</button>
          <button onClick={() => onApprove(editedArticle)} disabled={isLoading} className="btn-success flex items-center justify-center gap-2 disabled:opacity-50 font-inter"><CheckCircle className="w-5 h-5" />Aprovar & Publicar</button>
        </div>
      </div>
    </div>
  );
}