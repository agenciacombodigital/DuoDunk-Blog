import type { Metadata } from "next";
import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import { HelmetProvider } from 'react-helmet-async';
import '@/globals.css';
import ClientLayout from "@/components/ClientLayout";

// Configuração das Fontes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });

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
  openGraph: {
    title: "Duo Dunk - Notícias NBA",
    description: "O Jogo Dentro do Jogo. Cobertura completa da NBA.",
    siteName: "Duo Dunk",
    images: [
      {
        url: '/images/duodunk-logoV2.svg',
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
  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
      <body className="font-inter antialiased min-h-screen flex flex-col bg-white text-gray-900">
        <HelmetProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </HelmetProvider>
      </body>
    </html>
  );
}