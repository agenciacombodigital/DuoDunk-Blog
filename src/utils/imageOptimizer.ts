export function getOptimizedImageUrl(url: string, width: number = 800): string {
  if (!url) return '';

  // Se for imagem da ESPN, tenta substituir o tamanho no path
  // Ex: https://a.espncdn.com/i/teamlogos/nba/500/bos.png -> /500/ se torna /${width}/
  if (url.includes('espncdn.com')) {
    return url.replace(/\/500\//, `/${width}/`);
  }
  
  // Se for Supabase Storage, adiciona parâmetros de transformação
  if (url.includes('supabase.co/storage')) {
    // Evita adicionar um segundo '?' se já existirem parâmetros
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=80`;
  }
  
  return url;
}