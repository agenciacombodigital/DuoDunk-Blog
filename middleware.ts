// Middleware para Vercel Edge Runtime (Compatível com Vite/React)

// Lista de Robôs (User Agents)
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

// Configuração para dizer onde o middleware deve rodar
export const config = {
  matcher: [
    // Ignora API, arquivos estáticos, imagens e assets
    '/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\.(?:css|js|jpg|jpeg|png|gif|svg|ico|woff2?)$).*)',
  ],
};

export default async function middleware(request: Request) {
  /*
  // 1. Identificar o User Agent (Robô ou Humano?)
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBot = botUserAgents.some(bot => userAgent.includes(bot));

  // 2. Se for Robô, manda para o Prerender
  if (isBot) {
    const prerenderToken = process.env.PRERENDER_TOKEN;
    
    if (prerenderToken) {
      // Constrói a URL correta
      const url = new URL(request.url);
      const prerenderUrl = `https://service.prerender.io/${url.toString()}`;
      
      try {
        // Busca o HTML pronto no Prerender
        const response = await fetch(prerenderUrl, {
          headers: {
            'X-Prerender-Token': prerenderToken
          }
        });
        
        if (response.status === 200) {
            const html = await response.text();
            // Retorna o HTML puro para o Robô
            return new Response(html, {
              headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'X-Prerendered': 'true' // Marca para sabermos que funcionou
              },
              status: 200
            });
        }
      } catch (e) {
        console.error('Erro no Prerender, seguindo fluxo normal:', e);
      }
    }
  }

  // 3. Se for Humano ou der erro, o Vercel continua normal (serve o index.html do Vite)
  return fetch(request);
  */
  
  // Se o middleware não fizer nada, o Next.js continua o fluxo normal.
  // Se o problema for resolvido, reativaremos a lógica de bot/prerender.
}