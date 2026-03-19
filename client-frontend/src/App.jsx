import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import StaffLayout from './layouts/StaffLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import SearchPage from './pages/customer/SearchPage';
import TripDetailPage from './pages/customer/TripDetailPage';
import BookingPage from './pages/customer/BookingPage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import LoginPage from './pages/customer/LoginPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import QuickSalePage from './pages/staff/QuickSalePage';
import CheckInPage from './pages/staff/CheckInPage';
import HoldSeatPage from './pages/staff/HoldSeatPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import RoutesPage from './pages/admin/RoutesPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import TicketsPage from './pages/admin/TicketsPage';
import CustomersPage from './pages/admin/CustomersPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Portal */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="trip/:id" element={<TripDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="my-tickets" element={<MyTicketsPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>

        {/* Staff Portal */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
          <Route path="quick-sale" element={<QuickSalePage />} />
          <Route path="check-in" element={<CheckInPage />} />
          <Route path="hold-seats" element={<HoldSeatPage />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
