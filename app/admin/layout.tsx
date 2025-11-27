"use client";

import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

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

  if (!isAdmin) {
    // O useAuth já redireciona, mas retornamos null para evitar piscar
    return null; 
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader onLogout={handleLogout} />
      {children}
    </div>
  );
}