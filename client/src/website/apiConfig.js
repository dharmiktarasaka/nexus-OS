import { getBackendBaseUrl } from '../services/apiConfig';

// Centralized API Base URL configuration for Website Builder
const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') || getBackendBaseUrl();
export const API_BASE = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
export const PRIMARY_DOMAIN = import.meta.env.VITE_DEPLOY_DOMAIN || import.meta.env.VITE_PRIMARY_DOMAIN || 'tarasaka.com';

export function getWebsiteApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE ? `${API_BASE}${cleanEndpoint}` : cleanEndpoint;
}

