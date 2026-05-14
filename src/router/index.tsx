import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ConfirmCodePage } from '../pages/ConfirmCodePage';
import { HomePage } from '../pages/HomePage';
import { QuizPage } from '../pages/QuizPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/confirm-code', element: <ConfirmCodePage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <HomePage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/quizzes',
    element: (
      <ProtectedRoute allowedRoles={['curator', 'teacher', 'admin']}>
        <Layout>
          <QuizPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
