/**
 * @file ProtectedRoute.jsx
 * @author Alex Kachur
 * @since 2025-11-17
 * @purpose Gate component that waits for auth check, then redirects unauthenticated users to sign in.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}
