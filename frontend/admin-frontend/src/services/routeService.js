import api from './api';

const ENDPOINT = '/routes';

export const routeService = {
  // Get all routes
  getAll: () => api.get(ENDPOINT),

  // Get route by ID
  getById: (id) => api.get(`${ENDPOINT}/${id}`),

  // Create new route
  create: (data) => api.post(ENDPOINT, data),

  // Update route
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  // Delete route
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
};
