import { useState } from 'react';
import { CheckCircle, Edit, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle } from '@/lib/utils';

const focalPointToPercentage = (focalPoint: string | null | undefined): number => {
  if (!focalPoint) return 50;
  
  const cleanFocalPoint = focalPoint.replace(/px|em/g, '').trim();

  // Se for um par de coordenadas (ex: '30% 70%'), pegamos o primeiro valor (horizontal)
  if (cleanFocalPoint.includes(' ')) {
    const parts = cleanFocalPoint.split(' ');
    // Para o slider horizontal, queremos o primeiro valor (X)
    const horizontal = parts[0];
    if (horizontal.endsWith('%')) return parseInt(horizontal.replace('%', ''));
  }
  
  // Se for apenas a porcentagem (vertical ou horizontal)
  if (cleanFocalPoint.endsWith('%')) return parseInt(cleanFocalPoint.replace('%', ''));
  
  // Se for palavra-chave
  if (cleanFocalPoint === 'top' || cleanFocalPoint === 'left') return 0;
  if (cleanFocalPoint === 'center') return 50;
  if (cleanFocalPoint === 'bottom' || cleanFocalPoint === 'right') return 100;
  
  return 50;
};

export default function PendingApprovalCard({ article, uploadingImage, onImageUpload, onFocalPointChange, onFocalPointCommit, onToggleFeatured, onEdit, onApprove, onReject, onDelete }: any) {
  // Inicializa os estados de foco com fallback para '50%'
  const [focalPointDesktop, setFocalPointDesktop] = useState(focalPointToPercentage(article.image_focal_point));
  const [focalPointMobile, setFocalPointMobile] = useState(focalPointToPercentage(article.image_focal_point_mobile));

  // Função auxiliar para lidar com a mudança de foco
  const handleFocalPointChangeWrapper = (type: 'desktop' | 'mobile', value: number[]) => {
    const percentage = `${value[0]}%`;
    
    if (type === 'desktop') {
      setFocalPointDesktop(value[0]);
      // O foco desktop (16:9) usa o eixo X (horizontal)
      onFocalPointChange(article.id, [`${percentage} 50%`, article.image_focal_point_mobile]);
    } else {
      setFocalPointMobile(value[0]);
      // O foco mobile (3:4) usa o eixo Y (vertical)
      onFocalPointChange(article.id, [article.image_focal_point, percentage]);
    }
  };

  // Função auxiliar para lidar com o commit (salvar no DB)
  const handleFocalPointCommitWrapper = (type: 'desktop' | 'mobile', value: number[]) => {
    const percentage = `${value[0]}%`;
    
    if (type === 'desktop') {
      onFocalPointCommit(article.id, [`${percentage} 50%`, article.image_focal_point_mobile]);
    } else {
      onFocalPointCommit(article.id, [article.image_focal_point, percentage]);
    }
  };
  
  // Extrair o valor X do foco horizontal para o slider
  const currentHorizontalFocalPoint = focalPointToPercentage(article.image_focal_point?.split(' ')[0]);
  // Extrair o valor Y do foco mobile para o slider
  const currentMobileFocalPoint = focalPointToPercentage(article.image_focal_point_mobile);

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="p-6">
        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <label className="block text-sm text-gray-400 mb-2 font-semibold font-inter">📸 Imagem do Artigo:</label>
          {article.image_url && <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" style={getObjectPositionStyle(article.image_focal_point)} />}
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(article.id, file); }} disabled={uploadingImage === article.id} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer font-inter" />
          {uploadingImage === article.id && <p className="text-xs text-cyan-400 mt-2 animate-pulse flex items-center gap-2 font-inter"><Loader2 className="w-3 h-3 animate-spin" />Fazendo upload...</p>}
          
          {/* Foco Vertical Mobile (3:4) */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="text-sm font-semibold text-gray-400 font-inter">Foco Vertical (Mobile 3:4)</label>
            <div className="relative mb-4 rounded-xl overflow-hidden aspect-[3/4] border-2 border-pink-500/50 mt-2">
              <img
                src={article.image_url}
                alt="Preview Mobile"
                className="w-full h-full object-cover"
                style={getObjectPositionStyle(article.image_focal_point_mobile)}
              />
              <div className="absolute inset-0 border-4 border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                <span className="text-white text-xs bg-black/50 p-1 rounded font-inter">Corte Mobile (3:4)</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-400 font-inter">Topo</span>
              <Slider
                value={[currentMobileFocalPoint]}
                onValueChange={(value) => handleFocalPointChangeWrapper('mobile', value)}
                onValueCommit={(value) => handleFocalPointCommitWrapper('mobile', value)}
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
                onValueChange={(value) => handleFocalPointChangeWrapper('desktop', value)}
                onValueCommit={(value) => handleFocalPointCommitWrapper('desktop', value)}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400 font-inter">Direita</span>
            </div>
          </div>
        </div>
        <h3 className="font-oswald text-xl font-bold uppercase text-white mb-2">{article.title}</h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed font-inter">{article.summary}</p>
        <details className="mb-4"><summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold font-inter">📄 Ver conteúdo completo</summary><div className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96 font-inter" dangerouslySetInnerHTML={{ __html: article.body }} /></details>
        {article.tags && <div className="flex flex-wrap gap-2 mb-4">{article.tags.map((tag: string) => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded font-inter">#{tag}</span>))}</div>}
        <div className="flex gap-3">
          <button onClick={() => onToggleFeatured(article.id, article.is_featured)} className={`flex-1 ${article.is_featured ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition font-inter`} title={article.is_featured ? 'Remover destaque' : 'Marcar como destaque'}><Star className={`w-5 h-5 ${article.is_featured ? 'fill-white' : ''}`} />{article.is_featured ? 'Em Destaque' : 'Destacar'}</button>
          <button onClick={() => onEdit(article)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition font-inter" title="Editar antes de publicar"><Edit className="w-5 h-5" />Editar</button>
          <button onClick={() => onApprove(article)} className="btn-success flex-1 flex items-center justify-center gap-2 font-inter"><CheckCircle className="w-5 h-5" />Aprovar</button>
          <button onClick={() => onReject(article.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2 font-inter"><Trash2 className="w-5 h-5" />Rejeitar</button>
        </div>
      </div>
    </div>
  );
}