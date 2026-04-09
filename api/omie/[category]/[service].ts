export const config = {
  runtime: 'nodejs'
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const safeJsonParse = (text: string): any | null => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  const app_key = process.env.OMIE_APP_KEY || process.env.VITE_OMIE_APP_KEY;
  const app_secret = process.env.OMIE_APP_SECRET || process.env.VITE_OMIE_APP_SECRET;

  if (!app_key || !app_secret) {
    res.status(400).json({ error: 'Omie API keys are not configured on the server.' });
    return;
  }

  const categoryParam = req.query?.category;
  const serviceParam = req.query?.service;
  const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  const service = Array.isArray(serviceParam) ? serviceParam[0] : serviceParam;

  if (!category || !service) {
    res.status(400).json({ error: 'Missing Omie route params.' });
    return;
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON body.' });
      return;
    }
  }

  const { call, param } = body || {};
  if (!call) {
    res.status(400).json({ error: 'Missing call.' });
    return;
  }

  try {
    const url = `https://app.omie.com.br/api/v1/${category}/${service}/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call,
        app_key,
        app_secret,
        param
      })
    });

    const rawText = await response.text();
    const parsed = safeJsonParse(rawText);
    if (parsed) {
      res.status(response.status).json(parsed);
      return;
    }

    if (!rawText.trim()) {
      res.status(response.status).json({ error: `Empty response from Omie (HTTP ${response.status}).` });
      return;
    }

    res.status(response.status).json({ error: rawText });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch from Omie' });
  }
}
