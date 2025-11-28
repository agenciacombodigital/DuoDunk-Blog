import type { Metadata } from "next";

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