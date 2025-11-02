import { useState } from 'react';
import { CheckCircle, Edit, Loader2, Star, Trash2, Upload } from 'lucide-react';
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

export default function PendingApprovalCard({ article, uploadingImage, onImageUpload, onFocalPointChange, onFocalPointCommit, onToggleFeatured, onEdit, onApprove, onReject, onDelete }: any) {
  const [focalPoint, setFocalPoint] = useState(focalPointToPercentage(article.image_focal_point));

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="p-6">
        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <label className="block text-sm text-gray-400 mb-2 font-semibold">📸 Imagem do Artigo:</label>
          {article.image_url && <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" style={getObjectPositionStyle(article.image_focal_point)} />}
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(article.id, file); }} disabled={uploadingImage === article.id} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer" />
          {uploadingImage === article.id && <p className="text-xs text-cyan-400 mt-2 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />Fazendo upload...</p>}
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-400">Foco Vertical da Imagem</label>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-400">Topo</span>
              <Slider
                value={[focalPoint]}
                onValueChange={(value) => {
                  setFocalPoint(value[0]);
                  onFocalPointChange(article.id, value);
                }}
                onValueCommit={(value) => onFocalPointCommit(article.id, value)}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400">Baixo</span>
            </div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{article.summary}</p>
        <details className="mb-4"><summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold">📄 Ver conteúdo completo</summary><div className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96" dangerouslySetInnerHTML={{ __html: article.body }} /></details>
        {article.tags && <div className="flex flex-wrap gap-2 mb-4">{article.tags.map((tag: string) => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">#{tag}</span>))}</div>}
        <div className="flex gap-3">
          <button onClick={() => onToggleFeatured(article.id, article.is_featured)} className={`flex-1 ${article.is_featured ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition`} title={article.is_featured ? 'Remover destaque' : 'Marcar como destaque'}><Star className={`w-5 h-5 ${article.is_featured ? 'fill-white' : ''}`} />{article.is_featured ? 'Em Destaque' : 'Destacar'}</button>
          <button onClick={() => onEdit(article)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition" title="Editar antes de publicar"><Edit className="w-5 h-5" />Editar</button>
          <button onClick={() => onApprove(article)} className="btn-success flex-1 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />Aprovar</button>
          <button onClick={() => onReject(article.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" />Rejeitar</button>
          <button onClick={() => onDelete(article.id)} className="btn-danger flex-1 flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" />Deletar</button>
        </div>
      </div>
    </div>
  );
}