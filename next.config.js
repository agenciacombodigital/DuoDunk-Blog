/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Headers de segurança para a página de configurações (CORRIGIDO PARA O @IMGLY)
  async headers() {
    return [
      {
        source: '/admin/quiz/settings',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },

  // 🛠️ CORREÇÃO DO ERRO DE BUILD (WEBPACK)
  webpack: (config) => {
    // Força o Webpack a tratar arquivos .mjs como módulos ESM
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Ignora a biblioteca canvas que pode causar conflitos no Next.js
    config.resolve.alias.canvas = false;

    return config;
  },
}

module.exports = nextConfig;