import { google } from 'googleapis';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.INDEXING_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'É necessário enviar um array de URLs' 
      });
    }

    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });

    const results = [];
    
    for (const url of urls) {
      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        
        results.push({
          url: url,
          status: 'success',
          response: response.data
        });
        
        console.log(`✅ Indexação solicitada: ${url}`);
      } catch (error) {
        results.push({
          url: url,
          status: 'error',
          error: error.message
        });
        
        console.error(`❌ Erro ao indexar ${url}:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Solicitação de indexação enviada para ${urls.length} URLs`,
      results: results
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}