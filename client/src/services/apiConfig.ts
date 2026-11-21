// Central Production API Configuration & Server Pre-warming
// Automatically bridges custom domain deployments (e.g. sys.tarasaka.com) to the live Render backend.

export const PROD_BACKEND_URL = 'https://nexus-os-qg3c.onrender.com';

/**
 * Resolves the primary backend base URL.
 * Priority:
 * 1. VITE_API_URL explicitly defined in environment
 * 2. In production (deployed on custom domains like sys.tarasaka.com, tarasaka.com, vercel, etc.),
 *    defaults to the live Render backend service.
 * 3. In local development (localhost / 127.0.0.1), returns empty string to utilize Vite local proxies.
 */
export function getBackendBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
    if (!isLocal) {
      return PROD_BACKEND_URL;
    }
  }
  return '';
}

let hasWarmedUp = false;

/**
 * Fires an early, non-blocking lightweight ping to wake up the Render backend
 * from sleep (cold start) while the user is on the login page or opening the app.
 */
export function warmupServer() {
  if (hasWarmedUp) return;
  hasWarmedUp = true;

  const base = getBackendBaseUrl();
  const pingUrl = base ? `${base}/health` : '/api/health';

  // Fire and forget - wake up server without blocking any UI operations
  fetch(pingUrl, { method: 'GET', mode: 'cors' }).catch(() => {
    // Quiet fallback ping
    if (base) {
      fetch(`${base}/api/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
    }
  });
}
