import api from './axios';

const tripTemplateApi = {
  getAll:       (params = {}) => api.get('/trip-templates', { params }),
  getById:      (id)          => api.get(`/trip-templates/${id}`),
  create:       (data)        => api.post('/trip-templates', data),
  update:       (id, data)    => api.put(`/trip-templates/${id}`, data),
  remove:       (id)          => api.delete(`/trip-templates/${id}`),
  /** Generate 1 TripInstance for a specific date */
  generate:     (id, data)    => api.post(`/trip-templates/${id}/generate`, data),
  /** Bulk-generate TripInstances for a date range */
  bulkGenerate: (id, data)    => api.post(`/trip-templates/${id}/bulk-generate`, data),
};

export default tripTemplateApi;
