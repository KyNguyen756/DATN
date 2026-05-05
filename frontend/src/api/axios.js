import axios from 'axios';

const api = axios.create({
  // ==================== CHUYỂN SANG PRODUCTION ====================
  // baseURL: 'http://localhost:5000/api',        // ← Local Backend
  baseURL: 'https://datn-backend-bsyw.onrender.com/api',  // ← Production (Render)

  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: clear stale credentials
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;