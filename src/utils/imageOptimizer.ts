/**
 * Função placeholder para otimização de imagem.
 * No Next.js, a otimização é geralmente feita pelo componente <Image>.
 * Esta função retorna a URL original.
 */
export function getOptimizedImageUrl(url: string, width: number): string {
  // Se a URL for de um serviço externo que não é otimizado pelo Next.js,
  // você pode adicionar lógica de redimensionamento aqui.
  // Por enquanto, retorna a URL original.
  return url;
}