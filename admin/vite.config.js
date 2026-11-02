import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5182,
    host: '0.0.0.0',
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
  }
});
