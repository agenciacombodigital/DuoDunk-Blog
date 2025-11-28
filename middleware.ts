import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuração para dizer onde o middleware deve rodar
export const config = {
  matcher: [
    // Ignora API, arquivos estáticos, imagens e assets
    '/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\.(?:css|js|jpg|jpeg|png|gif|svg|ico|woff2?)$).*)',
  ],
};

export default async function middleware(request: NextRequest) {
  // Retorna o fluxo normal do Next.js.
  // Isso garante que o roteamento funcione corretamente no ambiente local e de produção.
  return NextResponse.next();
}