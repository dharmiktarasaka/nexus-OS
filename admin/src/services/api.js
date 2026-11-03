import axios from 'axios';

// Support production Vercel deployment with dynamic backend API URL
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
const adminBaseUrl = rawApiUrl ? `${rawApiUrl}/api/admin` : '/api/admin';

// Primary axios instance (points to production backend in Vercel or relative proxy in local dev)
const api = axios.create({
  baseURL: adminBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Secondary fallback direct instance if primary route times out or fails
const directApi = axios.create({
  baseURL: rawApiUrl ? `${rawApiUrl}/api/admin` : 'http://localhost:5050/api/admin',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Attach Admin Token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

directApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper that executes with automatic fallback to direct port 5050
async function executeWithFallback(operation) {
  try {
    return await operation(api);
  } catch (err) {
    // If relative proxy fails with network error or 5xx, try direct port 5050
    const isProxyFailure = !err.response || [500, 502, 503, 504].includes(err.response?.status);
    if (isProxyFailure) {
      try {
        return await operation(directApi);
      } catch (directErr) {
        const msg = directErr.response?.data?.message || err.response?.data?.message || directErr.message || err.message;
        const finalErr = new Error(msg);
        finalErr.response = directErr.response || err.response;
        throw finalErr;
      }
    }
    const msg = err.response?.data?.message || err.message;
    const finalErr = new Error(msg);
    finalErr.response = err.response;
    throw finalErr;
  }
}

export const adminApi = {
  login: async (email, password, masterKey) => {
    return executeWithFallback(async (client) => {
      const res = await client.post('/login', { email, password, masterKey });
      return res.data;
    });
  },

  getStats: async () => {
    return executeWithFallback(async (client) => {
      const res = await client.get('/stats');
      return res.data;
    });
  },

  getRequests: async (status = 'ALL') => {
    return executeWithFallback(async (client) => {
      const res = await client.get(`/requests?status=${encodeURIComponent(status)}`);
      return res.data;
    });
  },

  approveRequest: async (id) => {
    return executeWithFallback(async (client) => {
      const res = await client.post(`/requests/${encodeURIComponent(id)}/approve`);
      return res.data;
    });
  },

  rejectRequest: async (id, reason = '') => {
    return executeWithFallback(async (client) => {
      const res = await client.post(`/requests/${encodeURIComponent(id)}/reject`, { reason });
      return res.data;
    });
  },

  revokeRequest: async (id) => {
    return executeWithFallback(async (client) => {
      const res = await client.post(`/requests/${encodeURIComponent(id)}/revoke`);
      return res.data;
    });
  },

  deleteRequest: async (id) => {
    return executeWithFallback(async (client) => {
      const res = await client.delete(`/requests/${encodeURIComponent(id)}`);
      return res.data;
    });
  }
};

export default api;
