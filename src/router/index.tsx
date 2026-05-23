import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ConfirmCodePage } from '../pages/auth/ConfirmCodePage';
import { StaffHomePage } from '../pages/staff/home/StaffHomePage';
import { QuizManagementPage } from '../pages/staff/quiz/QuizManagementPage';
import { StudentHomePage } from '../pages/student/home/StudentHomePage';
import { StudentQuizListPage } from '../pages/student/quiz/StudentQuizListPage';
import { TakeQuizPage } from '../pages/student/quiz/TakeQuizPage';
import { QuizResultsPage } from '../pages/student/quiz/QuizResultsPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import { STAFF_ROLES } from '../constants';

function RoleBasedHome() {
  const { user } = useAuthStore();
  return user?.role === 'student' ? <StudentHomePage /> : <StaffHomePage />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/confirm-code', element: <ConfirmCodePage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <RoleBasedHome />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/quizzes',
    element: (
      <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
        <Layout>
          <QuizManagementPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/quizzes',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Layout>
          <StudentQuizListPage />
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
