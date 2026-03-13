import { Navigate, useLocation } from 'react-router-dom';

/**
 * Chỉ cho phép truy cập khi đã đăng nhập với tài khoản admin.
 * Khách hàng (role passenger) sẽ bị chuyển về trang đăng nhập.
 */
export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const userRole = localStorage.getItem('userRole');

  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'admin' && userRole !== 'admin') {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}
