export const config = {
  runtime: 'nodejs'
};

import { buildCacheKey, getCachedResponse, setCachedResponse } from '../../_lib/omieCache.js';

const inflight = new Map<string, Promise<{ status: number; data: any }>>();

function ttlFor(call: string): number {
  if (call === 'PesquisarFamilias') return 60 * 60;
  if (call === 'ListarProdutosResumido') return 60 * 10;
  if (call === 'ListarProdutos') return 60 * 10;
  return 60 * 2;
}

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
    const cacheBypass = req.headers?.['x-cache-bypass'] === '1' || req.query?.cache === '0';
    const cacheKey = buildCacheKey({ category, service, call, param });
    const ttlSeconds = ttlFor(call);

    if (!cacheBypass) {
      const cached = await getCachedResponse(cacheKey);
      if (cached) {
        res.setHeader('x-cache', 'HIT');
        res.status(cached.status).json(cached.data);
        return;
      }
    }

    const existing = inflight.get(cacheKey);
    if (existing) {
      const result = await existing;
      res.setHeader('x-cache', 'COALESCED');
      res.status(result.status).json(result.data);
      return;
    }

    const promise = (async () => {
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
        if (!cacheBypass && response.ok && !parsed?.faultstring) {
          await setCachedResponse(cacheKey, response.status, parsed, ttlSeconds);
        }
        return { status: response.status, data: parsed };
    }

    if (!rawText.trim()) {
        return { status: response.status, data: { error: `Empty response from Omie (HTTP ${response.status}).` } };
    }

      return { status: response.status, data: { error: rawText } };
    })();

    inflight.set(cacheKey, promise);
    try {
      const result = await promise;
      res.setHeader('x-cache', cacheBypass ? 'BYPASS' : 'MISS');
      res.status(result.status).json(result.data);
    } finally {
      inflight.delete(cacheKey);
    }
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch from Omie' });
  }
}
