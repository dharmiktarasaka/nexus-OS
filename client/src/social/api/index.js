import axios from 'axios';

// Single shared axios instance for all Mediamation Social API calls
const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const api = axios.create({
  baseURL: import.meta.env.VITE_SOCIAL_API_URL || (rawBase ? `${rawBase}/social-api` : '/social-api'),
});

// Request interceptor: attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('crm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 gracefully without forcing full page reload
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn('[Social API] Unauthorized request:', err.config?.url);
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  loginNotify: () => api.post('/auth/login-notify'),
};
export const accountsAPI = {
  list: () => api.get('/accounts'),
  disconnect: (id) => api.delete(`/accounts/${id}`),
  facebookAuth: (params) => api.get('/accounts/facebook', { params }),
  instagramAuth: (params) => api.get('/accounts/instagram', { params }),
  pinterestAuth: (params) => api.get('/accounts/pinterest', { params }),
  tumblrAuth: (params) => api.get('/accounts/tumblr', { params }),
  linkedinAuth: (params) => api.get('/accounts/linkedin', { params }),
  connectFacebook: (data) => api.post('/accounts/connect-facebook', data),
  connectInstagramPrivate: (data) => api.post('/accounts/connect-instagram-private', data),
  connectToken: (data) => api.post('/accounts/connect-token', data),
  connectDemo: (data) => api.post('/accounts/connect-demo', data),
};
export const postsAPI = {
  list: (params) => api.get('/posts', { params }),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  remove: (id) => api.delete(`/posts/${id}`),
};

// Upload API — uses the SAME shared instance so auth token is always included.
export const uploadAPI = {
  upload: (formData) => api.post('/upload', formData),
  generateCaption: (data) => api.post('/ai/generate-caption', data),
};