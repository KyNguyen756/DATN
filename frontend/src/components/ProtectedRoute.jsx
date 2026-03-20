import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wraps a route so it requires the user to be logged in.
 * Optionally restricts to a specific role ('admin' | 'staff').
 *
 * Usage:
 *   <ProtectedRoute><MyPage /></ProtectedRoute>
 *   <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    // Redirect to login, remembering where the user wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Logged in but wrong role
    return <Navigate to="/" replace />;
  }

  return children;
}
