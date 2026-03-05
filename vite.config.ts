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
          // Use Custom API directly via Node.js fetch (available in Node 18+)
          const response = await fetch("https://short.scrollwebid.com/api/v1/links", {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer 1|2X0cGxZ5xOhh4nPaCY3ipCNXHKnZ9SU0F8naTME25a8eaa08',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              original_url: longUrl,
              custom_slug: "",
              password: "",
              expires_at: ""
            })
          });

          const data: any = await response.json();

          if (data && data.success && data.data && data.data.short_code) {
            const shortUrl = `https://short.scrollwebid.com/${data.data.short_code}`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ longUrl, shortUrl }));
          } else {
            console.error('API Error Response:', data);
            throw new Error(data.message || 'Invalid response from URL Shortener API');
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
