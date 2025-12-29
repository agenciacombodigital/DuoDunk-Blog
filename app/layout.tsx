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
    default: "DuoDunk - Notícias NBA em Tempo Real e Quiz Milhão NBA",
    template: "%s | DuoDunk"
  },
  description: "Acompanhe as últimas notícias da NBA em tempo real, análises táticas, estatísticas ao vivo e desafie seus amigos no Quiz Milhão NBA. O melhor do basquete está aqui!",
  
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "DuoDunk",
    title: "DuoDunk - Notícias NBA em Tempo Real e Quiz Milhão NBA",
    description: "Acompanhe as últimas notícias da NBA em tempo real, análises táticas, estatísticas ao vivo e desafie seus amigos no Quiz Milhão NBA. O melhor do basquete está aqui!",
    images: [
      {
        url: "/images/card-twitter-duodunk.jpg",
        width: 1200,
        height: 628,
        alt: "DuoDunk - O Portal do Basquete NBA",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@duodunk",
    creator: "@duodunk",
    title: "DuoDunk - Notícias NBA em Tempo Real e Quiz Milhão NBA",
    description: "Acompanhe as últimas notícias da NBA em tempo real, análises táticas, estatísticas ao vivo e desafie seus amigos no Quiz Milhão NBA. O melhor do basquete está aqui!",
    images: ["/images/card-twitter-duodunk.jpg"],
  },

  icons: {
    icon: [
      { url: '/images/favicon-duodunkv2.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/images/favicon-duodunkv2.svg'],
    apple: [
      { url: '/images/favicon-duodunkv2.svg' },
    ],
  },
  
  robots: {
    index: true,
    follow: true,
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