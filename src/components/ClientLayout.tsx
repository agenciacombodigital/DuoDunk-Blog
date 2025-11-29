"use client";

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NBAScoreboardV2 from '@/components/NBAScoreboardV2';
import { Toaster } from "@/components/ui/sonner";
import { HelmetProvider } from 'react-helmet-async';
import { cn } from '@/lib/utils'; // Mantendo o cn para classes condicionais

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <HelmetProvider>
      <AuthProvider>
        <div className={cn("min-h-screen flex flex-col", isAdminRoute ? 'bg-black' : 'bg-white')}>
          {!isAdminRoute && <Header />}
          {!isAdminRoute && <NBAScoreboardV2 />}
          
          <main className="flex-grow min-h-[calc(100vh-300px)]">
            {children}
          </main>

          {!isAdminRoute && <Footer />}
        </div>
        <Toaster richColors theme={isAdminRoute ? 'dark' : 'light'} />
      </AuthProvider>
    </HelmetProvider>
  );
}