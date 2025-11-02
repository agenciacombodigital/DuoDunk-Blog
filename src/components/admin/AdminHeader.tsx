import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎯 Admin - DuoDunk</h1>
        <button onClick={onLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">🚪 Sair</button>
      </div>
    </div>
  );
}