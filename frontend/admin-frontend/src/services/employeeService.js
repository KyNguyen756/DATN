import api from './api';

const ENDPOINT = '/employees';

export const employeeService = {
  // Get all employees
  getAll: () => api.get(ENDPOINT),

  // Get employee by ID
  getById: (id) => api.get(`${ENDPOINT}/${id}`),

  // Create new employee
  create: (data) => api.post(ENDPOINT, data),

  // Update employee
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  // Delete employee
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),

  // Get employee statistics
  getStats: () => api.get(`${ENDPOINT}/stats`),
};
