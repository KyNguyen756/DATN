import api from './api';

const ENDPOINT = '/dashboard';

export const dashboardService = {
  // Get dashboard statistics
  getStats: () => api.get(`${ENDPOINT}/stats`),

  // Get revenue data
  getRevenue: (params) => api.get(`${ENDPOINT}/revenue`, { params }),

  // Get trip data
  getTrips: (params) => api.get(`${ENDPOINT}/trips`, { params }),

  // Get passenger data
  getPassengers: (params) => api.get(`${ENDPOINT}/passengers`, { params }),
};
