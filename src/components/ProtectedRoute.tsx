import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role ?? '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
