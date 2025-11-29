import type { Metadata } from "next";
import { Inter, Oswald, Bebas_Neue } from 'next/font/google';
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

// Configuração de Fontes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });

export const metadata: Metadata = {
  title: "Duo Dunk - O Jogo Dentro do Jogo",
  description: "Notícias, análises e estatísticas da NBA.",
  icons: {
    icon: '/images/icone-duodunk.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable} ${bebas.variable}`}>
      <body className="font-inter bg-white text-gray-900 antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}