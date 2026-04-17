import { jwtDecode } from 'jwt-decode';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages auth state, decodes JWT for role/expiry,
 * and auto-logs-out on token expiration.
 *
 * Security improvements:
 * - Decodes JWT on load to verify expiry (prevents stale localStorage)
 * - Clears auth state on expired tokens instead of trusting stored JSON blindly
 * - Adds isTokenExpired helper
 */
function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    // exp is UNIX seconds; add 10s buffer
    return exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    // Validate on cold boot — clear if expired
    if (!isTokenValid(stored)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return stored;
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  // Auto-logout when token expires mid-session
  useEffect(() => {
    if (!token) return;
    try {
      const { exp } = jwtDecode(token);
      const msLeft = exp * 1000 - Date.now();
      if (msLeft <= 0) {
        logout();
        return;
      }
      const timer = setTimeout(() => {
        console.warn('[AuthContext] Token expired — logging out');
        logout();
      }, Math.min(msLeft, 2_147_483_647)); // clamp to JS max
      return () => clearTimeout(timer);
    } catch {
      logout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin, isStaff, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { isTokenValid };
