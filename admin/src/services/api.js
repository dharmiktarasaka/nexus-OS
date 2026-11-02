import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Attach Admin Token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  login: async (email, password, masterKey) => {
    const res = await api.post('/login', { email, password, masterKey });
    return res.data;
  },

  getStats: async () => {
    const res = await api.get('/stats');
    return res.data;
  },

  getRequests: async (status = 'ALL') => {
    const res = await api.get(`/requests?status=${encodeURIComponent(status)}`);
    return res.data;
  },

  approveRequest: async (id) => {
    const res = await api.post(`/requests/${encodeURIComponent(id)}/approve`);
    return res.data;
  },

  rejectRequest: async (id, reason = '') => {
    const res = await api.post(`/requests/${encodeURIComponent(id)}/reject`, { reason });
    return res.data;
  },

  revokeRequest: async (id) => {
    const res = await api.post(`/requests/${encodeURIComponent(id)}/revoke`);
    return res.data;
  },

  deleteRequest: async (id) => {
    const res = await api.delete(`/requests/${encodeURIComponent(id)}`);
    return res.data;
  }
};

export default api;
