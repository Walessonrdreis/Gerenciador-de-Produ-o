import { loadAppState, saveAppState, type AppStatePayload } from './_lib/stateStore.js';

export const config = {
  runtime: 'nodejs'
};

function safeJsonParse(text: string): unknown | null {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAppStatePayload(value: unknown): value is AppStatePayload {
  if (!isPlainObject(value)) return false;
  return Array.isArray(value.products) && Array.isArray(value.materials) && Array.isArray(value.orders) && isPlainObject(value.config) && (value.sectors === undefined || Array.isArray(value.sectors));
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const data = await loadAppState();
      res.status(200).json({ data });
      return;
    }

    if (req.method === 'PUT') {
      let body: any = req.body;
      if (typeof body === 'string') {
        const parsed = safeJsonParse(body);
        if (!parsed) {
          res.status(400).json({ error: 'Invalid JSON body.' });
          return;
        }
        body = parsed;
      }

      if (!isPlainObject(body)) {
        res.status(400).json({ error: 'Invalid body.' });
        return;
      }

      if (!isAppStatePayload(body)) {
        res.status(400).json({ error: 'Invalid payload shape.' });
        return;
      }

      await saveAppState(body);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
