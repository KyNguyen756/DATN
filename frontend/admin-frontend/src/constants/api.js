export const API_ENDPOINTS = {
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_REVENUE: '/dashboard/revenue',

  // Buses
  BUSES: '/buses',
  BUS_GET: '/buses/:id',
  BUS_CREATE: '/buses',
  BUS_UPDATE: '/buses/:id',
  BUS_DELETE: '/buses/:id',

  // Routes
  ROUTES: '/routes',
  ROUTE_GET: '/routes/:id',
  ROUTE_CREATE: '/routes',
  ROUTE_UPDATE: '/routes/:id',
  ROUTE_DELETE: '/routes/:id',

  // Trips
  TRIPS: '/trips',
  TRIP_GET: '/trips/:id',
  TRIP_CREATE: '/trips',
  TRIP_UPDATE: '/trips/:id',
  TRIP_DELETE: '/trips/:id',

  // Tickets
  TICKETS: '/tickets',
  TICKET_GET: '/tickets/:id',
  TICKET_UPDATE_STATUS: '/tickets/:id/status',
  TICKET_STATS: '/tickets/stats',

  // Passengers
  PASSENGERS: '/passengers',
  PASSENGER_GET: '/passengers/:id',
  PASSENGER_SEARCH: '/passengers/search',
  PASSENGER_STATS: '/passengers/stats',

  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE_GET: '/employees/:id',
  EMPLOYEE_CREATE: '/employees',
  EMPLOYEE_UPDATE: '/employees/:id',
  EMPLOYEE_DELETE: '/employees/:id',
  EMPLOYEE_STATS: '/employees/stats',
};

export const TICKET_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TICKET_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const EMPLOYEE_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
};

export const EMPLOYEE_ROLE_LABELS = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  staff: 'Nhân viên',
};

export const BUS_TYPES = [
  { value: 'limousine', label: 'Limousine' },
  { value: 'sleeper', label: 'Giường nằm' },
  { value: 'chair', label: 'Ghế ngồi' },
  { value: 'vip', label: 'VIP' },
];
