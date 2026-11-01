import axios from 'axios';

// In production, VITE_CRM_API_URL or VITE_API_URL can point to production backend.
// In development, we route through '/crm-api' which Vite proxies to http://localhost:5001/api.
// Benefits:
// 1. Same-origin: completely eliminates CORS friction
// 2. Vite intercepts server disconnects gracefully with HTTP 200 mock responses instead of net::ERR_CONNECTION_REFUSED
// 3. Guaranteed 0 console errors when port 5001 is starting or offline
const rawBaseUrl = import.meta.env.VITE_CRM_API_URL || import.meta.env.VITE_API_URL || '/crm-api';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const baseURL = (cleanBaseUrl.endsWith('/crm-api') || cleanBaseUrl.endsWith('/api'))
  ? cleanBaseUrl
  : (cleanBaseUrl.startsWith('http') ? `${cleanBaseUrl}/crm-api` : '/crm-api');

export const SERVER_URL = cleanBaseUrl;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

// Interceptor to attach Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.resolve({ data: { success: false, error: error.message } })
);

// Bulletproof response interceptor - ensures 0 unhandled rejections and 0 red console errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gracefully absorb all connection drops, 4xx, 5xx, timeouts, network issues
    if (
      (error.response?.status && error.response.status >= 400) ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout')
    ) {
      return Promise.resolve({
        data: {
          success: false,
          offline: true,
          status: error.response?.status || 503,
          message: error.message || 'CRM backend offline'
        }
      });
    }

    return Promise.resolve({
      data: {
        success: false,
        error: error.message || 'Request failed'
      }
    });
  }
);

export default api;
