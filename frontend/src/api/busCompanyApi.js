import api from './axios';

export const busCompanyApi = {
  /** Admin: paginated list | Staff: returns own company only */
  getAll: (params = {}) => api.get('/bus-companies', { params }),

  /** Get single company by id */
  getById: (id) => api.get(`/bus-companies/${id}`),

  /** Admin only: create */
  create: (data) => api.post('/bus-companies', data),

  /** Admin / own-company staff: update */
  update: (id, data) => api.put(`/bus-companies/${id}`, data),

  /** Admin only: delete */
  remove: (id) => api.delete(`/bus-companies/${id}`),

  /** Add stations to a company */
  addStations: (id, stationIds) =>
    api.post(`/bus-companies/${id}/stations`, { stationIds }),

  /** Remove a single station from a company */
  removeStation: (id, stationId) =>
    api.delete(`/bus-companies/${id}/stations/${stationId}`),

  /** Admin: assign staff user to a company */
  assignStaff: (userId, busCompanyId, stationIds = []) =>
    api.put(`/users/${userId}/assign-company`, { busCompanyId, stationIds }),
};

export default busCompanyApi;
