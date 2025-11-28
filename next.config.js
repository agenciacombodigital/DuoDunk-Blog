/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'brerfpcfkyptkzygyzxl.supabase.co',
      'cdn.nba.com',
      'theplayoffs.com.br',
      'duodunk.com.br',
      'm.media-amazon.com',
      'images-na.ssl-images-amazon.com',
      'a.espncdn.com',
      'images.unsplash.com'
    ],
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
}

module.exports = nextConfig;