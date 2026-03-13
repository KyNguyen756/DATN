import api from './api';

const ENDPOINT = '/trips';

export const tripService = {
  search: (params) => api.get(ENDPOINT, { params: { from: params.from, to: params.to, date: params.date } }),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
};
