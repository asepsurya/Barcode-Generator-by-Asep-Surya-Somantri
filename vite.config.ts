import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function urlShortenerPlugin(): Plugin {
  return {
    name: 'url-shortener-api',
    configureServer(server) {
      server.middlewares.use('/api/shorten', async (req, res) => {
        const url = new URL(req.url || '', 'http://localhost');
        const longUrl = url.searchParams.get('url');

        if (!longUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          // Use TinyURL API directly via Node.js fetch (available in Node 18+)
          const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
          const response = await fetch(apiUrl);
          const shortUrl = await response.text();

          if (shortUrl && shortUrl.startsWith('http')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ longUrl, shortUrl }));
          } else {
            throw new Error('Invalid response from TinyURL');
          }
        } catch (err: any) {
          console.error('Shorten error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Failed to shorten' }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), urlShortenerPlugin()],
})
