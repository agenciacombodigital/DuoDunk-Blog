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

const baseUrl = 'https://www.duodunk.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "DuoDunk - Notícias NBA e Quiz Milhão",
    template: "%s | DuoDunk"
  },
  description: "Acompanhe as últimas notícias da NBA e desafie seus amigos no Quiz Milhão NBA.",
  
  // Configuração para Facebook, LinkedIn, Discord, WhatsApp
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "DuoDunk",
    title: "DuoDunk - Notícias NBA e Quiz Milhão",
    description: "Acompanhe as últimas notícias da NBA e desafie seus amigos no Quiz Milhão NBA.",
    images: [
      {
        url: `${baseUrl}/images/logo-duodunk-share.jpg`,
        width: 1200,
        height: 630,
        alt: "DuoDunk - Notícias NBA e Quiz Milhão",
      },
    ],
  },

  // Configuração Específica para Twitter / X
  twitter: {
    card: "summary_large_image",
    site: "@duodunk",
    title: "DuoDunk - Notícias NBA e Quiz Milhão",
    description: "Acompanhe as últimas notícias da NBA e desafie seus amigos no Quiz Milhão NBA.",
    images: [`${baseUrl}/images/logo-duodunk-share.jpg`],
  },

  // Ícones
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