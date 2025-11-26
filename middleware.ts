import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de Robôs que devem receber a página pré-renderizada (HTML pronto)
const botUserAgents = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'embedly',
  'baiduspider',
  'pinterest',
  'slackbot',
  'vkShare',
  'facebot',
  'outbrain',
  'W3C_Validator',
  'whatsapp'
];

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBot = botUserAgents.some(bot => userAgent.includes(bot));
  
  // Ignora arquivos estáticos (imagens, css, js) para economizar quota
  const isFile = request.nextUrl.pathname.match(/\.(css|js|jpg|png|gif|ico|svg|woff2)$/);

  // Se for Robô e não for arquivo, manda pro Prerender
  if (isBot && !isFile) {
    // Pega o token que configuramos na Vercel
    const prerenderToken = process.env.PRERENDER_TOKEN;
    
    if (prerenderToken) {
      const url = request.nextUrl.toString();
      const prerenderUrl = `https://service.prerender.io/${url}`;
      
      try {
        // Pede ao Prerender a versão HTML da página
        const response = await fetch(prerenderUrl, {
          headers: {
            'X-Prerender-Token': prerenderToken
          }
        });
        
        if (response.status === 200) {
            const html = await response.text();
            return new NextResponse(html, {
              headers: { 'Content-Type': 'text/html' }
            });
        }
      } catch (e) {
        console.error('Erro Prerender, seguindo normal:', e);
      }
    }
  }

  // Se for Humano ou der erro, carrega o site React normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica em todas as rotas, exceto api e arquivos internos do next
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};