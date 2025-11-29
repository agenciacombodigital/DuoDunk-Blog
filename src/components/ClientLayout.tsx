"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NBAScoreboardV2 from '@/components/NBAScoreboardV2';
import { Toaster } from "@/components/ui/sonner";
import { cn } from '@/lib/utils';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <AuthProvider>
      <div className={cn("flex-grow flex flex-col", isAdminRoute ? 'bg-black' : 'bg-white')}>
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
      <Toaster richColors theme={isAdminRoute ? 'dark' : 'light'} />
    </AuthProvider>
  );
}