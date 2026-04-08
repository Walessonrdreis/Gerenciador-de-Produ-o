import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Omie Proxy Route
  app.post('/api/omie/:category/:service', async (req, res) => {
    const { category, service } = req.params;
    const { call, param } = req.body;
    const app_key = process.env.OMIE_APP_KEY || process.env.VITE_OMIE_APP_KEY;
    const app_secret = process.env.OMIE_APP_SECRET || process.env.VITE_OMIE_APP_SECRET;

    if (!app_key || !app_secret) {
      return res.status(400).json({ error: 'Omie API keys are not configured on the server.' });
    }
    
    try {
      const url = `https://app.omie.com.br/api/v1/${category}/${service}/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call,
          app_key,
          app_secret,
          param
        })
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Omie Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch from Omie' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
