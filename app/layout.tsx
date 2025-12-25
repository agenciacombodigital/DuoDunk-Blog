import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import "@/globals.css";
import ClientLayout from "@/components/ClientLayout";
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.duodunk.com.br'),
  title: {
    default: 'DuoDunk - Notícias NBA, Estatísticas e Onde Assistir Hoje',
    template: '%s | Duo Dunk',
  },
  description: "Notícias NBA em tempo real, análises táticas, estatísticas ao vivo e Quiz NBA. Cobertura completa do basquete em português.",
  alternates: {
    canonical: './',
  },
  keywords: ['NBA hoje', 'Onde assistir NBA', 'Notícias Basquete', 'Duo Dunk', 'Estatísticas NBA'],
  // ✅ CONFIGURAÇÃO DE ÍCONES MULTI-NAVEGADOR
  icons: {
    icon: [
      { url: '/images/logo-icon.svg', type: 'image/svg+xml' },
      { url: '/images/icone-duodunk.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/images/logo-icon.svg',
    apple: '/images/icone-duodunk.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "DuoDunk - Notícias NBA, Estatísticas e Onde Assistir Hoje",
    description: "Notícias NBA em tempo real, análises táticas, estatísticas ao vivo e Quiz NBA. Cobertura completa do basquete em português.",
    url: 'https://www.duodunk.com.br',
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
  twitter: {
    card: 'summary_large_image',
    site: '@duodunk',
    creator: '@duodunk',
    images: ['/images/duodunk-logoV2.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Duo Dunk",
    "url": "https://www.duodunk.com.br",
    "logo": "https://www.duodunk.com.br/images/duodunk-logoV2.svg",
    "sameAs": [
      "https://www.instagram.com/duodunk/",
      "https://www.threads.net/@duodunk"
    ]
  };

  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
      <body className="font-inter bg-white text-gray-900 antialiased min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <ClientLayout>
          {children}
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}