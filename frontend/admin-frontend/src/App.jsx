import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import MainLayout from './components/MainLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusManagement from './pages/BusManagement';
import RouteManagement from './pages/RouteManagement';
import TripManagement from './pages/TripManagement';
import TicketManagement from './pages/TicketManagement';
import PassengerManagement from './pages/PassengerManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/buses"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <BusManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/routes"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <RouteManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <TripManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <TicketManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/passengers"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <PassengerManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <EmployeeManagement />
                </MainLayout>
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
