import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute — requires authentication.
 * Optionally restricts to a role or array of roles.
 *
 * Usage:
 *   <ProtectedRoute>                          → any logged-in user
 *   <ProtectedRoute role="admin">             → admin only
 *   <ProtectedRoute role={["admin","staff"]}> → admin or staff
 */
export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    // staff routes also allow admin ("admin" is a superset of "staff")
    const userAllowed = allowed.some(r => {
      if (r === 'staff') return user.role === 'staff' || user.role === 'admin';
      return user.role === r;
    });
    if (!userAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

/**
 * AdminRoute — shorthand for <ProtectedRoute role="admin">
 * Use in App.jsx wherever only admins should access.
 */
export function AdminRoute({ children }) {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
}

/**
 * StaffRoute — shorthand for <ProtectedRoute role={["admin","staff"]}>
 */
export function StaffRoute({ children }) {
  return <ProtectedRoute role={['admin', 'staff']}>{children}</ProtectedRoute>;
}
