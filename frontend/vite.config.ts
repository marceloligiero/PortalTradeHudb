import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env so VITE_API_BASE_URL is available here
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Support adding the machine's public IP at runtime via the
  // DEV_PUBLIC_IP environment variable (start script will set this).
  // Also keep the cloudflared quick-tunnel host allowed.
  const publicIp = process.env.DEV_PUBLIC_IP || env.DEV_PUBLIC_IP || '';
  const allowedHosts: Array<string | any> = ['.trycloudflare.com'];
  if (publicIp) {
    if (publicIp === 'all') {
      // Vite accepts the special value 'all' to allow any host.
      // We'll push the string 'all' so runtime will accept any host.
      // Type system may not like it but Vite reads it at runtime.
      // @ts-ignore
      allowedHosts.push('all');
    } else {
      allowedHosts.push(publicIp);
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      // Allow requests addressed to the machine public IP and trycloudflare
      allowedHosts,
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
