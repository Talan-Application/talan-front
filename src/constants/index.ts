export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'talan_access_token',
  REFRESH_TOKEN: 'talan_refresh_token',
  USER: 'talan_user',
  PENDING_EMAIL: 'talan_pending_email',
  PENDING_FLOW: 'talan_pending_flow',
} as const;

export const PAGE_SIZES = [6, 12, 24] as const;

export const PASS_THRESHOLD = 60;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CONFIRM_CODE: '/confirm-code',
  QUIZZES: '/quizzes',
  TAKE_QUIZ: (id: number) => `/quizzes/${id}/take`,
  QUIZ_RESULTS: (id: number) => `/quizzes/${id}/results`,
} as const;
