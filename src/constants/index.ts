export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'talan_access_token',
  REFRESH_TOKEN: 'talan_refresh_token',
  USER: 'talan_user',
  PENDING_EMAIL: 'talan_pending_email',
  PENDING_FLOW: 'talan_pending_flow',
} as const;

export const PAGE_SIZES = [6, 12, 24] as const;

export const PASS_THRESHOLD = 60;

export const STAFF_ROLES = ['admin', 'curator', 'teacher'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const LANGUAGES = [
  { languageCode: 'ru', name: 'Русский', nativeName: 'Русский', isActive: true },
  { languageCode: 'kk', name: 'Қазақша', nativeName: 'Қазақша', isActive: true },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['languageCode'];

export const ROUTES = {
  HOME: '/home',
  LANDING: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CONFIRM_CODE: '/confirm-code',
  QUIZZES: '/quizzes',
  COMMON_SUBJECTS: '/common-subjects',
  STUDENT_QUIZZES: '/student/quizzes',
  TAKE_QUIZ: (id: number) => `/quizzes/${id}/take`,
  QUIZ_RESULTS: (id: number) => `/quizzes/${id}/results`,
} as const;
