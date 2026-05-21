import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../constants';

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role ?? '')) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
