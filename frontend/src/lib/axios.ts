import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getBaseURL = () => {
  // In development prefer the relative `/api` so Vite's proxy handles host/port.
  // This avoids hardwired env values blocking requests when opening the app
  // by IP (e.g. http://192.168.x.x:5173).
  if (import.meta.env.DEV) {
    return '/api';
  }

  // 1) explicit full base (recommended): VITE_API_BASE_URL
  let envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    // ensure it points to the API prefix (ends with /api)
    if (!envBase.endsWith('/api')) {
      envBase = envBase.replace(/\/$/, '') + '/api';
    }
    return envBase;
  }

  // 2) explicit port only (VITE_API_PORT) -> same host as frontend
  const envPort = import.meta.env.VITE_API_PORT;
  if (envPort) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:${envPort}/api`;
  }

  // fallback: default to port 8000 on the same host (API prefix)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8000/api`;
};

const api = axios.create({
  // baseURL will be set dynamically
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,  // Disabled for CORS with wildcard
});

// Set baseURL dynamically in request interceptor
api.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getBaseURL();
  }
  // Normalize duplicate '/api' when dev proxy is used: requests often
  // include '/api/...' and baseURL is '/api' -> results in '/api/api/...'
  // Remove leading '/api' from url in that case.
  if (config.baseURL && config.baseURL.replace(/\/$/, '') === '/api' && config.url?.startsWith('/api')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  // Debug: show how requests are being composed in dev
  if (import.meta.env.DEV) {
    try {
      // eslint-disable-next-line no-console
      console.debug(`[api] baseURL=${config.baseURL} url=${config.url}`);
    } catch (e) {}
  }
  return config;
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[api] Authorization header set:', config.headers.Authorization ? 'YES' : 'NO');
      } catch (e) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    if (import.meta.env.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[api] response error status:', error.response?.status, 'url:', error.config?.url);
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;
