import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env so VITE_API_BASE_URL is available here
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Proxy `/api` to backend during dev to avoid CORS and allow opening
      // the frontend by IP while backend runs on any port.
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          // If backend responds with absolute redirect (Location header)
          // that points to localhost:8000, the browser will follow it and
          // trigger CORS. Rewrite absolute Location headers to relative
          // paths so the dev-server proxy handles them.
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              const loc = proxyRes.headers && proxyRes.headers['location'];
              if (loc && typeof loc === 'string') {
                // strip origin from location so browser stays on vite origin
                proxyRes.headers['location'] = loc.replace(/^https?:\/\/[0-9A-Za-z:\.\-]+/, '');
              }
            });
          },
        },
      },
    },
  };
});
