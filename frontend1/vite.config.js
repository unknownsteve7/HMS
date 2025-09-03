import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Handle payment callback URLs specially, converting POST to GET
          if (req.method === 'POST' && req.url.startsWith('/payment/')) {
            console.log(`⚠️ Payment callback received via POST: ${req.url}`);

            // Capture POST data for debugging
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });

            req.on('end', () => {
              console.log('POST body:', body);

              // Extract form data and add to URL as query params
              const params = new URLSearchParams(body);
              const queryString = params.toString();

              // Create a URL with the query parameters
              const redirectUrl = req.url + (req.url.includes('?') ? '&' : '?') + queryString;

              // Respond with a 303 redirect to make browser convert POST to GET
              console.log(`Redirecting to: ${redirectUrl}`);
              res.writeHead(303, { Location: redirectUrl });
              res.end();
            });

            return; // Important: stop middleware chain here
          }

          // Special handling for payment error redirects
          if (req.url.includes('/payment/') && req.url.includes('error=')) {
            console.log(`⚠️ Payment error detected in URL: ${req.url}`);
          }

          // For regular requests, handle SPA fallback as before
          const isDirectRequest = req.headers.accept && req.headers.accept.includes('text/html');
          if (isDirectRequest && !req.url.startsWith('/api/') && !req.url.includes('.')) {
            console.log(`SPA fallback: redirecting ${req.url} to index.html`);
            req.url = '/';
          }
          next();
        });
      }
    }
  ],
  server: {
    allowedHosts: ['localhost', 'https://ssehostelbackend-production.up.railway.app'],
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
