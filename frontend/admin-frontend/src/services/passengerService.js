import api from './api';

const ENDPOINT = '/users';

export const passengerService = {
  getAll: () => api.get(ENDPOINT),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  search: (query) => api.get(ENDPOINT).then((res) => {
    const list = res.data || [];
    const q = (query || '').toLowerCase();
    return { data: q ? list.filter((u) =>
      [u.firstName, u.lastName, u.username, u.email, u.phoneNumber].some((v) =>
        (v || '').toLowerCase().includes(q)
      )
    ) : list };
  }),
  getStats: async () => {
    const res = await api.get(ENDPOINT);
    const list = res.data || [];
    const now = new Date();
    const thisMonth = list.filter((u) => new Date(u.createdAt) >= new Date(now.getFullYear(), now.getMonth(), 1));
    return {
      data: {
        totalPassengers: list.length,
        newPassengersThisMonth: thisMonth.length,
        averageTicketPerPassenger: 0,
      },
    };
  },
};
