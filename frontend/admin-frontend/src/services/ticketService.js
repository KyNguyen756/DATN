import api from './api';

const ENDPOINT = '/booking';

export const ticketService = {
  getAll: async () => {
    const res = await api.get(ENDPOINT);
    const bookings = res.data || [];
    return {
      data: bookings.map((b) => ({
        id: b._id,
        passengerName: b.passengerName || (b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() : ''),
        phone: b.passengerPhone || b.user?.phoneNumber || '',
        seatNumber: (b.seats || []).map((s) => s.seat?.seatNumber).filter(Boolean).join(', '),
        route: b.trip ? `${b.trip.departureLocation || ''} → ${b.trip.arrivalLocation || ''}` : '',
        departureDate: b.trip?.departureTime,
        price: b.totalPrice,
        status: b.status,
      })),
    };
  },
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  updateStatus: (id, status) => {
    if (status === 'cancelled') return api.patch(`${ENDPOINT}/${id}/cancel`);
    if (status === 'confirmed') return api.post(`${ENDPOINT}/${id}/confirm`);
    return Promise.resolve({ data: {} });
  },
  getStats: () => Promise.resolve({ data: {} }),
};
