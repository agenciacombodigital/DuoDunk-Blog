import { CheckCircle } from 'lucide-react';
import PendingApprovalCard from './PendingApprovalCard';

interface PendingApprovalSectionProps {
  articles: any[];
  uploadingImage: string | null;
  onImageUpload: (articleId: string, file: File) => void;
  onFocalPointChange: (articleId: string, value: number[]) => void;
  onFocalPointCommit: (articleId: string, value: number[]) => void;
  onToggleFeatured: (articleId: string, isFeatured: boolean) => void;
  onEdit: (article: any) => void;
  onApprove: (article: any) => void;
  onReject: (articleId: string) => void;
  onDelete: (articleId: string) => void;
}

export default function PendingApprovalSection({ articles, ...props }: PendingApprovalSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
      <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-cyan-400" />
        Artigos Processados ({articles.length})
      </h2>
      <div className="space-y-6">
        {articles.map((article) => (
          <PendingApprovalCard key={article.id} article={article} {...props} />
        ))}
      </div>
    </div>
  );
}