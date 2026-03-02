import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env so VITE_API_BASE_URL is available here
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Support adding the machine's public IP at runtime via the
  // DEV_PUBLIC_IP environment variable (start script will set this).
  // Also keep the cloudflared quick-tunnel host allowed.
  const publicIp = process.env.DEV_PUBLIC_IP || env.DEV_PUBLIC_IP || '';
  const allowedHosts: Array<string | any> = ['.trycloudflare.com', '.loca.lt'];
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
    plugins: [
      react(),
      // Pre-compress assets at build time (saves CPU at runtime)
      viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Code splitting for faster parallel loading on mobile
      rollupOptions: {
        output: {
          manualChunks: {
            // React core - cached separately, rarely changes
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // UI/animation libs
            'vendor-ui': ['framer-motion', 'lucide-react', 'clsx'],
            // Form handling
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Charts
            'vendor-charts': ['recharts'],
            // PDF generation (heavy, rarely used)
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
            // Rich text editor (heavy, rarely used)
            'vendor-editor': [
              '@tiptap/react', '@tiptap/starter-kit',
              '@tiptap/extension-color', '@tiptap/extension-highlight',
              '@tiptap/extension-image', '@tiptap/extension-link',
              '@tiptap/extension-placeholder', '@tiptap/extension-text-align',
              '@tiptap/extension-text-style', '@tiptap/extension-underline',
            ],
            // State & data
            'vendor-data': ['zustand', '@tanstack/react-query', 'axios', 'date-fns'],
            // i18n
            'vendor-i18n': ['i18next', 'react-i18next'],
          },
        },
      },
      // Target modern browsers for smaller output
      target: 'es2020',
      // Increase chunk warning threshold
      chunkSizeWarningLimit: 600,
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
