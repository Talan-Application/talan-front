import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ConfirmCodePage } from '../pages/ConfirmCodePage';
import { HomePage } from '../pages/HomePage';
import { QuizPage } from '../pages/QuizPage';
import { TakeQuizPage } from '../pages/TakeQuizPage';
import { QuizResultsPage } from '../pages/QuizResultsPage';
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
  {
    path: '/quizzes/:id/take',
    element: (
      <ProtectedRoute>
        <Layout>
          <TakeQuizPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/quizzes/:id/results',
    element: (
      <ProtectedRoute>
        <Layout>
          <QuizResultsPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
