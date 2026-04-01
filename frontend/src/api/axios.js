import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

// On 401: clear stale token — each page/ProtectedRoute handles redirect individually.
// Do NOT auto-redirect here so guests can still browse public pages freely.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Chỉ redirect nếu đang ở trang yêu cầu auth (không phải trang public)
      const publicPaths = ['/', '/search', '/login'];
      const isPublic = publicPaths.some(p => window.location.pathname === p)
        || window.location.pathname.startsWith('/trip/');
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
