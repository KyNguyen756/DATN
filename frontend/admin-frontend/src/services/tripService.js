import api from './api';

const ENDPOINT = '/trips';

export const tripService = {
  // Get all trips
  getAll: () => api.get(ENDPOINT),

  // Get trip by ID
  getById: (id) => api.get(`${ENDPOINT}/${id}`),

  // Create new trip
  create: (data) => api.post(ENDPOINT, data),

  // Update trip
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  // Delete trip
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
};
