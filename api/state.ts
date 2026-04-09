import { loadAppState, saveAppState } from '../src/server/stateStore';

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
        body = JSON.parse(body);
      }

      if (!body || typeof body !== 'object') {
        res.status(400).json({ error: 'Invalid body.' });
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
