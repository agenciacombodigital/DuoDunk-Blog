import { useState } from 'react';
import { CheckCircle, Edit, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle, getHorizontalFocalPoint, getVerticalFocalPoint } from '@/lib/utils';
import ImageFocalPointEditor from './ImageFocalPointEditor'; // Importando o novo editor

export default function PendingApprovalCard({ article, uploadingImage, onImageUpload, onFocalPointChange, onFocalPointCommit, onToggleFeatured, onEdit, onApprove, onReject, onDelete }: any) {
  
  // Handlers para o novo editor
  const handleFocalPointChange = (desktop: string, mobile: string) => {
    // Chama a função de mudança de estado no AdminPage
    onFocalPointChange(article.id, [desktop, mobile]);
  };

  const handleFocalPointCommit = (desktop: string, mobile: string) => {
    // Chama a função de commit no AdminPage
    onFocalPointCommit(article.id, [desktop, mobile]);
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="p-4 md:p-6">
        <h3 className="font-oswald text-lg md:text-xl font-bold uppercase text-white mb-2">{article.title}</h3>
        <p className="text-cyan-400 text-sm mb-4 line-clamp-2 leading-snug font-inter">{article.summary}</p>
        
        {/* Seção de Imagem e Foco */}
        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <label className="block text-sm text-gray-400 mb-2 font-semibold font-inter">📸 Imagem do Artigo:</label>
          {article.image_url && <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" style={getObjectPositionStyle(article.image_focal_point)} />}
          
          {/* Upload */}
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(article.id, file); }} disabled={uploadingImage === article.id} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer font-inter" />
          {uploadingImage === article.id && <p className="text-xs text-cyan-400 mt-2 animate-pulse flex items-center gap-2 font-inter"><Loader2 className="w-3 h-3 animate-spin" />Fazendo upload...</p>}
          
          {/* NOVO EDITOR DE FOCO */}
          {article.image_url && (
            <div className="mt-6">
              <ImageFocalPointEditor
                imageUrl={article.image_url}
                initialFocalPointDesktop={article.image_focal_point || '50% 50%'}
                initialFocalPointMobile={article.image_focal_point_mobile || '50%'}
                onFocalPointChange={handleFocalPointChange}
                onFocalPointCommit={handleFocalPointCommit}
              />
            </div>
          )}
        </div>
        
        {/* Conteúdo e Tags */}
        <details className="mb-4"><summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold font-inter">📄 Ver conteúdo completo</summary><div className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96 font-inter" dangerouslySetInnerHTML={{ __html: article.body }} /></details>
        {article.tags && <div className="flex flex-wrap gap-2 mb-4">{article.tags.map((tag: string) => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded font-inter">#{tag}</span>))}</div>}
        
        {/* Botões de Ação - Grid responsivo */}
        <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
          <button onClick={() => onToggleFeatured(article.id, article.is_featured)} className={`flex-1 ${article.is_featured ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition font-inter text-sm`} title={article.is_featured ? 'Remover destaque' : 'Marcar como destaque'}><Star className={`w-4 h-4 ${article.is_featured ? 'fill-white' : ''}`} />{article.is_featured ? 'Destaque' : 'Destacar'}</button>
          <button onClick={() => onEdit(article)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition font-inter text-sm" title="Editar antes de publicar"><Edit className="w-4 h-4" />Editar</button>
          <button onClick={() => onApprove(article)} className="btn-success flex-1 flex items-center justify-center gap-2 font-inter text-sm"><CheckCircle className="w-4 h-4" />Aprovar</button>
          <button onClick={() => onReject(article.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2 font-inter text-sm"><Trash2 className="w-4 h-4" />Rejeitar</button>
        </div>
      </div>
    </div>
  );
}