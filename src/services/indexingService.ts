import axios from 'axios';
import { toast } from 'sonner';

const INDEXING_API_URL = '/api/request-google-indexing';

/**
 * Solicita a indexação de URLs ao Google Indexing API.
 * @param urls Array de URLs completas para indexar.
 */
export async function requestGoogleIndexing(urls: string[]) {
  if (urls.length === 0) return;

  const siteUrl = 'https://www.duodunk.com.br'; // URL base do site
  const fullUrls = urls.map(url => url.startsWith('http') ? url : `${siteUrl}${url}`);

  console.log('🚀 Solicitando indexação para URLs:', fullUrls);

  try {
    // Nota: Em produção, o Vercel injetará o INDEXING_SECRET.
    // Em desenvolvimento, esta chamada pode falhar se a variável não estiver configurada.
    const response = await axios.post(INDEXING_API_URL, { urls: fullUrls }, {
      headers: {
        // Usamos uma variável de ambiente para o secret, que deve ser configurada no Vercel
        'Authorization': `Bearer ${import.meta.env.VITE_INDEXING_SECRET || 'dummy-secret-dev'}`
      }
    });

    if (response.data.success) {
      toast.info(`Indexação solicitada para ${response.data.results.length} URLs.`, {
        description: 'O Google foi notificado sobre o novo conteúdo.'
      });
    } else {
      throw new Error(response.data.error || 'Falha desconhecida na API de Indexação.');
    }
  } catch (error: any) {
    console.error('Erro ao solicitar indexação:', error.message);
    toast.warning('Falha ao notificar o Google Indexing API.', {
      description: 'Verifique as variáveis de ambiente (INDEXING_SECRET/GOOGLE_SERVICE_ACCOUNT_KEY).'
    });
  }
}