"use client"; // Mantendo como Client Component

import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NBAScoreboardV2 from '@/components/NBAScoreboardV2';
import { usePathname } from 'next/navigation'; // Usando usePathname no cliente
import { useEffect, useState } from 'react';
import '@/globals.css';

// Configuração das fontes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas' });

// Metadata estática (removida daqui, pois o Next.js App Router a gerencia em page.tsx)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const toasterTheme = isAdminRoute ? 'dark' : 'light';
  
  // Estado para controlar a hidratação
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Se não estiver montado, renderiza apenas o esqueleto para evitar hidratação incorreta
  if (!isMounted) {
    return (
      <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
        <body className={`min-h-screen flex flex-col ${isAdminRoute ? 'bg-black' : 'bg-white'}`}>
          {/* Renderiza o children para que o loading.tsx ou o conteúdo SSR apareça */}
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
      <body className={`min-h-screen flex flex-col ${isAdminRoute ? 'bg-black' : 'bg-white'}`}>
        <AuthProvider>
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
        </AuthProvider>
        <Sonner richColors theme={toasterTheme} />
      </body>
    </html>
  );
}