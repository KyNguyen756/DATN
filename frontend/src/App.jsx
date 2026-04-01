import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import StaffLayout from './layouts/StaffLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import SearchPage from './pages/customer/SearchPage';
import TripDetailPage from './pages/customer/TripDetailPage';
import BookingPage from './pages/customer/BookingPage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/customer/LoginPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import CounterSalePage from './pages/staff/CounterSalePage';
import QuickSalePage  from './pages/staff/QuickSalePage';
import CheckInPage    from './pages/staff/CheckInPage';
import HoldSeatPage   from './pages/staff/HoldSeatPage';
import SeatMapDemo    from './pages/staff/SeatMapDemo'; // dev-only

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import RoutesPage from './pages/admin/RoutesPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import TicketsPage from './pages/admin/TicketsPage';
import CustomersPage from './pages/admin/CustomersPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import StationsPage from './pages/admin/StationsPage';
import BusCompanyList   from './pages/admin/BusCompanyList';
import BusCompanyForm   from './pages/admin/BusCompanyForm';
import BusCompanyDetail from './pages/admin/BusCompanyDetail';
import TripTemplateList from './pages/admin/TripTemplateList';
import TripTemplateForm from './pages/admin/TripTemplateForm';

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
          <Route path="login" element={<LoginPage />} />

          {/* booking: không wrap ProtectedRoute — redirect xử lý bên trong TripDetailPage */}
          <Route path="booking" element={<BookingPage />} />
          <Route path="my-tickets" element={
            <ProtectedRoute><MyTicketsPage /></ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
        </Route>

        {/* Staff Portal — requires staff or admin role */}
        <Route path="/staff" element={
          <ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>
        }>
          <Route index element={<StaffDashboard />} />
          <Route path="counter-sale"  element={<CounterSalePage />} />
          <Route path="quick-sale"   element={<QuickSalePage />} />
          <Route path="check-in"     element={<CheckInPage />} />
          <Route path="hold-seats"   element={<HoldSeatPage />} />
          <Route path="seat-demo"    element={<SeatMapDemo />} /> {/* dev-only */}
        </Route>

        {/* Admin Dashboard — requires admin role */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="stations" element={<StationsPage />} />
          {/* Bus Company management */}
          <Route path="bus-companies"          element={<BusCompanyList />} />
          <Route path="bus-companies/new"      element={<BusCompanyForm />} />
          <Route path="bus-companies/:id"      element={<BusCompanyDetail />} />
          <Route path="bus-companies/:id/edit" element={<BusCompanyForm />} />
          {/* Trip Template management */}
          <Route path="trip-templates"          element={<TripTemplateList />} />
          <Route path="trip-templates/new"      element={<TripTemplateForm />} />
          <Route path="trip-templates/:id/edit" element={<TripTemplateForm />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
