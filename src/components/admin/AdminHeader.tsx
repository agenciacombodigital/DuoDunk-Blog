import Link from 'next/link';

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-2xl font-bold text-white hover:text-pink-500 transition-colors">🎯 Admin - DuoDunk</Link>
          <div className="hidden sm:flex gap-4">
            <Link href="/admin/quiz" className="text-sm font-bold text-yellow-400 hover:text-white transition-colors">🏆 Quiz Admin</Link>
            <Link href="/admin/palpites" className="text-sm font-bold text-pink-400 hover:text-white transition-colors">🔮 Palpites Admin</Link>
          </div>
        </div>
        <button onClick={onLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">🚪 Sair</button>
      </div>
    </div>
  );
}