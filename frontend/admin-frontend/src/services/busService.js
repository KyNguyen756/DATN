import api from './api';

const ENDPOINT = '/buses';

export const busService = {
  // Get all buses
  getAll: () => api.get(ENDPOINT),

  // Get bus by ID
  getById: (id) => api.get(`${ENDPOINT}/${id}`),

  // Create new bus
  create: (data) => api.post(ENDPOINT, data),

  // Update bus
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  // Delete bus
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
};
