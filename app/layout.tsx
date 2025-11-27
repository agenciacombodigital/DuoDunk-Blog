import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NBAScoreboardV2 from '@/components/NBAScoreboardV2';
import { headers } from 'next/headers';
import '@/globals.css';

// Configuração das fontes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas' });

export const metadata = {
  title: 'Duo Dunk - O Jogo Dentro do Jogo',
  description: 'As últimas notícias, resultados e análises do mundo da NBA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usamos headers para verificar a rota no Server Component
  const headersList = headers();
  const pathname = headersList.get('x-invoke-path') || headersList.get('x-url') || '/';
  const isAdminRoute = pathname.startsWith('/admin');

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
        <Sonner richColors />
      </body>
    </html>
  );
}