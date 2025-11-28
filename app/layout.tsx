"use client";

import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NBAScoreboardV2 from '@/components/NBAScoreboardV2';
import { usePathname } from 'next/navigation';
import '@/globals.css';
import { HelmetProvider } from 'react-helmet-async';

// Configuração das Fontes Otimizadas
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const oswald = Oswald({ 
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

const bebas = Bebas_Neue({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const toasterTheme = isAdminRoute ? 'dark' : 'light';
  
  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
      <body className={`min-h-screen flex flex-col font-inter antialiased ${isAdminRoute ? 'bg-black' : 'bg-white'}`}>
        <HelmetProvider>
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
        </HelmetProvider>
        <Sonner richColors theme={toasterTheme} />
      </body>
    </html>
  );
}