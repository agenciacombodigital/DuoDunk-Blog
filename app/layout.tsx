import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import LayoutContent from '@/components/LayoutContent';
import '@/globals.css';
import type { Metadata } from "next";

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

// Metadados Globais (Server Component)
export const metadata: Metadata = {
  title: "Duo Dunk - O Jogo Dentro do Jogo",
  description: "Notícias, análises e estatísticas da NBA.",
  icons: {
    icon: [
      { url: '/images/icone-duodunk.png', href: '/images/icone-duodunk.png' },
    ],
    shortcut: ['/images/icone-duodunk.png'],
    apple: [
      { url: '/images/icone-duodunk.png' },
    ],
  },
  // Adiciona OpenGraph padrão para compartilhamento
  openGraph: {
    title: "Duo Dunk - Notícias NBA",
    description: "O Jogo Dentro do Jogo. Cobertura completa da NBA.",
    siteName: "Duo Dunk",
    images: [
      {
        url: '/images/duodunk-logoV2.svg', // Logo principal como fallback
        width: 800,
        height: 600,
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removida a heurística isAdminRoute. O LayoutContent (Client) cuidará da renderização condicional.

  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
      {/* Removida a classe condicional do body. O LayoutContent (Client) cuidará do fundo. */}
      <body className="min-h-screen flex flex-col font-inter antialiased">
        <LayoutContent>
          {children}
        </LayoutContent>
      </body>
    </html>
  );
}