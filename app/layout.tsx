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
  
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "DuoDunk",
    title: "DuoDunk - Notícias NBA e Quiz Milhão",
    description: "Acompanhe as últimas notícias da NBA e desafie seus amigos no Quiz Milhão NBA.",
    images: [
      {
        url: "/images/card-twitter-duodunk.jpg", // Arquivo que realmente existe no projeto
        width: 1200,
        height: 630,
        alt: "DuoDunk NBA",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@duodunk",
    creator: "@duodunk",
    title: "DuoDunk - Notícias NBA e Quiz Milhão",
    description: "Acompanhe as últimas notícias da NBA e desafie seus amigos no Quiz Milhão NBA.",
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