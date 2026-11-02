import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    force: true
  },
  server: {
    port: 5182,
    host: '0.0.0.0',
    strictPort: false,
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            console.error('[Admin Dev Proxy] Cannot reach backend on port 5050 for:', req?.url);
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: 'Backend server is offline or starting up on port 5050. Please ensure npm run server or node start.js is running.'
              }));
            }
          });
        }
      }
    }
  },
  preview: {
    port: 5182,
    host: '0.0.0.0',
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            console.error('[Admin Preview Proxy] Cannot reach backend on port 5050 for:', req?.url);
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: 'Central backend server is offline or starting up on port 5050. Please ensure node start.js is running.'
              }));
            }
          });
        }
      }
    }
  }
});
