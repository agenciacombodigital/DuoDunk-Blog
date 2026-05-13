"use client";

import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Verifica se a rota atual é a de login
  const isLoginPage = pathname === '/admin/login';

  const handleLogout = async () => {
    await logout();
    toast.info("Você foi desconectado.");
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  // Se não for admin e NÃO for a página de login, bloqueia o render para segurança
  // O hook useAuth já lida com o redirecionamento automático
  if (!isAdmin && !isLoginPage) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mostra o header administrativo apenas se o usuário estiver logado */}
      {isAdmin && <AdminHeader onLogout={handleLogout} />}
      
      {/* Renderiza o conteúdo (incluindo a página de login quando necessário) */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}