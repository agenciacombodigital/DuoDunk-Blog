import { useState } from 'react';
import { CheckCircle, Edit, Loader2, Star, Trash2, Upload, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle, getHorizontalFocalPoint, getVerticalFocalPoint } from '@/lib/utils';

export default function PendingApprovalCard({ article, uploadingImage, onImageUpload, onFocalPointChange, onFocalPointCommit, onToggleFeatured, onEdit, onApprove, onReject, onDelete }: any) {
  // Estado local para o preview do slider
  const [localFocalPointDesktop, setLocalFocalPointDesktop] = useState(article.image_focal_point || '50% 50%');
  const [localFocalPointMobile, setLocalFocalPointMobile] = useState(article.image_focal_point_mobile || '50%');

  // Atualiza o estado local quando o artigo muda (ex: após upload de imagem)
  if (article.image_focal_point !== localFocalPointDesktop && article.image_focal_point) {
    setLocalFocalPointDesktop(article.image_focal_point);
  }
  if (article.image_focal_point_mobile !== localFocalPointMobile && article.image_focal_point_mobile) {
    setLocalFocalPointMobile(article.image_focal_point_mobile);
  }

  // Handlers para o Slider
  const handleDesktopChange = (value: number[]) => {
    const newX = `${value[0]}%`;
    const currentY = getVerticalFocalPoint(localFocalPointDesktop);
    const newFocalPoint = `${newX} ${currentY}%`;
    setLocalFocalPointDesktop(newFocalPoint);
    onFocalPointChange(article.id, [newFocalPoint, localFocalPointMobile]);
  };

  const handleMobileChange = (value: number[]) => {
    const newY = `${value[0]}%`;
    setLocalFocalPointMobile(newY);
    onFocalPointChange(article.id, [localFocalPointDesktop, newY]);
  };

  const handleDesktopCommit = (value: number[]) => {
    const newX = `${value[0]}%`;
    const currentY = getVerticalFocalPoint(localFocalPointDesktop);
    const newFocalPoint = `${newX} ${currentY}%`;
    onFocalPointCommit(article.id, [newFocalPoint, localFocalPointMobile]);
  };

  const handleMobileCommit = (value: number[]) => {
    const newY = `${value[0]}%`;
    onFocalPointCommit(article.id, [localFocalPointDesktop, newY]);
  };
  
  // Valores para o Slider
  const currentHorizontalFocalPoint = getHorizontalFocalPoint(localFocalPointDesktop);
  const currentMobileFocalPoint = getVerticalFocalPoint(localFocalPointMobile);

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="p-4 md:p-6">
        {/* NOVO CABEÇALHO COM AUTOR E FONTE */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-inter">{article.source}</span>
            <span className="text-xs font-bold text-pink-500 flex items-center gap-1 font-inter">
              Por: {article.author || 'Duo Dunk'}
            </span>
          </div>
          <span className="text-gray-500 text-xs font-inter">
            {new Date(article.processed_at || article.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* FIM NOVO CABEÇALHO */}

        <h3 className="font-oswald text-lg md:text-xl font-bold uppercase text-white mb-2">{article.title}</h3>
        <p className="text-cyan-400 text-sm mb-4 line-clamp-2 leading-snug font-inter">{article.summary}</p>
        
        {/* Seção de Imagem e Foco */}
        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <label className="block text-sm text-gray-400 mb-2 font-semibold font-inter">📸 Imagem do Artigo:</label>
          {article.image_url && <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" style={getObjectPositionStyle(localFocalPointDesktop)} />}
          
          {/* Upload */}
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(article.id, file); }} disabled={uploadingImage === article.id} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer font-inter" />
          {uploadingImage === article.id && <p className="text-xs text-cyan-400 mt-2 animate-pulse flex items-center gap-2 font-inter"><Loader2 className="w-3 h-3 animate-spin" />Fazendo upload...</p>}
          
          {/* Foco Vertical Mobile (3:4) */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="text-sm font-semibold text-gray-400 font-inter">Foco Vertical (Mobile 3:4)</label>
            <div className="relative mb-4 rounded-xl overflow-hidden aspect-[3/4] border-2 border-pink-500/50 mt-2 max-h-64 mx-auto max-w-xs">
              <img
                src={article.image_url}
                alt="Preview Mobile"
                className="w-full h-full object-cover"
                style={getObjectPositionStyle(localFocalPointMobile, true)}
              />
              <div className="absolute inset-0 border-4 border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                <span className="text-white text-xs bg-black/50 p-1 rounded font-inter">Corte Mobile (3:4)</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-400 font-inter">Topo</span>
              <Slider
                value={[currentMobileFocalPoint]}
                onValueChange={handleMobileChange}
                onValueCommit={handleMobileCommit}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400 font-inter">Baixo</span>
            </div>
          </div>
          
          {/* Foco Horizontal (Desktop 16:9) */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="text-sm font-semibold text-gray-400 font-inter">Foco Horizontal (Desktop 16:9)</label>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-400 font-inter">Esquerda</span>
              <Slider
                value={[currentHorizontalFocalPoint]}
                onValueChange={handleDesktopChange}
                onValueCommit={handleDesktopCommit}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400 font-inter">Direita</span>
            </div>
          </div>
        </div>
        
        {/* Conteúdo e Tags */}
        <details className="mb-4"><summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold font-inter">📄 Ver conteúdo completo</summary><div className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96 font-inter" dangerouslySetInnerHTML={{ __html: article.body }} /></details>
        {article.tags && <div className="flex flex-wrap gap-2 mb-4">{article.tags.map((tag: string) => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded font-inter">#{tag}</span>))}</div>}
        
        {/* Botões de Ação - Grid responsivo */}
        <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
          <button onClick={() => onToggleFeatured(article.id, article.is_featured)} className={`flex-1 ${article.is_featured ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition font-inter text-sm`} title={article.is_featured ? 'Remover destaque' : 'Marcar como destaque'}><Star className={`w-4 h-4 ${article.is_featured ? 'fill-white' : ''}`} />{article.is_featured ? 'Destaque' : 'Destacar'}</button>
          <button onClick={() => onEdit(article)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition font-inter text-sm" title="Editar antes de publicar"><Edit className="w-4 h-4" />Editar</button>
          <button onClick={() => onApprove(article)} className="btn-success flex-1 flex items-center justify-center gap-2 font-inter text-sm"><CheckCircle className="w-4 h-4" />Aprovar</button>
          
          {/* Botão de Rejeitar (Mover para Lixeira) */}
          <button onClick={() => onReject(article.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2 font-inter text-sm" title="Mover para Lixeira"><X className="w-4 h-4" />Rejeitar</button>
          
          {/* NOVO: Botão de Deletar (Exclusão Permanente) */}
          <button onClick={() => onDelete(article.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2 font-inter text-sm" title="Deletar permanentemente"><Trash2 className="w-4 h-4" />Deletar</button>
        </div>
      </div>
    </div>
  );
}