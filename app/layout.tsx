import type { Metadata } from "next";
import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import "@/globals.css"; // Caminho corrigido
import ClientLayout from "@/components/ClientLayout";

// Configuração de Fontes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });

export const metadata: Metadata = {
  title: "Duo Dunk - O Jogo Dentro do Jogo",
  description: "Notícias, análises e estatísticas da NBA.",
  // Configuração Completa de Ícones
  icons: {
    icon: [
      { url: '/images/icone-duodunk.png' }, // Padrão para navegadores modernos
      { url: '/images/icone-duodunk.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/icone-duodunk.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: ['/images/icone-duodunk.png'], // Para navegadores antigos
    apple: [
      { url: '/images/icone-duodunk.png', sizes: '180x180', type: 'image/png' }, // iPhone/iPad Home Screen
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/images/icone-duodunk.png',
      },
    ],
  },
  manifest: '/manifest.json', // Arquivo para Android/Chrome
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
  
  // Dados Estruturados da Organização
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
        {/* Script JSON-LD para o Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}