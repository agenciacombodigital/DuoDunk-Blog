interface AdminStatsProps {
  pendingProcessingCount: number;
  autoApprovedCount: number;
  pendingApprovalCount: number;
  publishedCount: number;
  rateLimitedCount: number; // Novo
}

export default function AdminStats({ pendingProcessingCount, autoApprovedCount, pendingApprovalCount, publishedCount, rateLimitedCount }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800"><p className="text-gray-400 text-xs md:text-sm mb-1">Aguardando Processamento</p><p className="text-2xl md:text-3xl font-bold text-yellow-400">{pendingProcessingCount}</p></div>
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800"><p className="text-gray-400 text-xs md:text-sm mb-1">Auto-Aprovados (Shams)</p><p className="text-2xl md:text-3xl font-bold text-green-400">{autoApprovedCount}</p></div>
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800"><p className="text-gray-400 text-xs md:text-sm mb-1">Aguardando Aprovação</p><p className="text-2xl md:text-3xl font-bold text-cyan-400">{pendingApprovalCount}</p></div>
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800"><p className="text-gray-400 text-xs md:text-sm mb-1">Total Publicado</p><p className="text-2xl md:text-3xl font-bold text-pink-400">{publishedCount}</p></div>
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800"><p className="text-gray-400 text-xs md:text-sm mb-1">Rate Limit</p><p className="text-2xl md:text-3xl font-bold text-red-400">{rateLimitedCount}</p></div>
    </div>
  );
}