import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Handle payment callback URLs specially, converting POST to GET
          if (req.method === 'POST' && req.url.startsWith('/payment/')) {


            // Capture POST data for debugging
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });

            req.on('end', () => {


              // Extract form data and add to URL as query params
              const params = new URLSearchParams(body);
              const queryString = params.toString();

              // Create a URL with the query parameters
              const redirectUrl = req.url + (req.url.includes('?') ? '&' : '?') + queryString;

              res.writeHead(303, { Location: redirectUrl });
              res.end();
            });

            return; // Important: stop middleware chain here
          }

          // Special handling for payment error redirects
          if (req.url.includes('/payment/') && req.url.includes('error=')) {
          }

          // For regular requests, handle SPA fallback as before
          const isDirectRequest = req.headers.accept && req.headers.accept.includes('text/html');
          if (isDirectRequest && !req.url.startsWith('/api/') && !req.url.includes('.')) {
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
