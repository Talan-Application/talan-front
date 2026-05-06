import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ConfirmCodePage } from '../pages/ConfirmCodePage';
import { HomePage } from '../pages/HomePage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/confirm-code', element: <ConfirmCodePage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
