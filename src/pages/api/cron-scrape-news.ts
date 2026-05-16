import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "brerfpcfkyptkzygyzxl";

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_PROJECT_REF) {
    return res.status(500).json({ message: 'Missing Supabase environment variables' });
  }

  const edgeFunctionUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/scrape-news`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error calling scrape-news Edge Function: ${response.status} - ${JSON.stringify(errorData)}`);
      return res.status(response.status).json({ message: 'Failed to call Supabase Edge Function', error: errorData });
    }

    const data = await response.json();
    return res.status(200).json({ message: 'scrape-news Edge Function triggered successfully', data });
  } catch (error: any) {
    console.error('Error in cron-scrape-news Vercel Function:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}