"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NBAScoreboardV2 from '@/components/NBAScoreboardV2';
import { usePathname } from 'next/navigation';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import { HelmetProvider } from 'react-helmet-async';
import { cn } from '@/lib/utils'; // Importando cn para classes

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const toasterTheme = isAdminRoute ? 'dark' : 'light';

  return (
    <HelmetProvider>
      <AuthProvider>
        <div className={cn("min-h-screen flex flex-col", isAdminRoute ? 'bg-black' : 'bg-white')}>
          {!isAdminRoute && (
            <>
              <Header />
              <NBAScoreboardV2 />
            </>
          )}
          <main className="flex-grow">
            {children}
          </main>
          {!isAdminRoute && <Footer />}
        </div>
      </AuthProvider>
      <Sonner richColors theme={toasterTheme} />
    </HelmetProvider>
  );
}