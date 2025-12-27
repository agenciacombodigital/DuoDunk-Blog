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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duodunk.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "DuoDunk - Notícias NBA, Estatísticas e Quiz",
    template: "%s | DuoDunk"
  },
  description: "A sua fonte diária de NBA no Brasil. Fique por dentro das últimas notícias, rumores de trocas, estatísticas, onde assistir aos jogos e teste seus conhecimentos no nosso exclusivo Quiz NBA.",
  
  // Configuração para Facebook, LinkedIn, Discord, WhatsApp
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "DuoDunk",
    title: "DuoDunk - Notícias NBA, Estatísticas e Quiz",
    description: "A sua fonte diária de NBA no Brasil. Fique por dentro das últimas notícias, rumores de trocas, estatísticas e teste seus conhecimentos no nosso exclusivo Quiz NBA.",
    images: [
      {
        url: "/images/banner-duodunkv2.jpg",
        width: 1200,
        height: 630,
        alt: "DuoDunk NBA",
      },
    ],
  },

  // Configuração Específica para Twitter / X
  twitter: {
    card: "summary_large_image",
    title: "DuoDunk - Notícias NBA, Estatísticas e Quiz",
    description: "Acompanhe as últimas notícias da NBA, estatísticas e desafie seus amigos no Quiz NBA.",
    images: ["/images/card-twitter-duodunk.jpg"],
    creator: "@duodunk", 
  },

  // Ícones (Ajustado para o arquivo v2 existente)
  icons: {
    icon: [
      { url: '/images/favicon-duodunkv2.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/images/favicon-duodunkv2.svg'],
    apple: [
      { url: '/images/favicon-duodunkv2.svg' },
    ],
  },
  
  // Robôs de busca
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
    "logo": "https://www.duodunk.com.br/images/duodunkv2-logo.svg",
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