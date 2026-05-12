const ACCESS_KEY = 'talan_access_token';
const REFRESH_KEY = 'talan_refresh_token';
const USER_KEY = 'talan_user';

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string): void => { localStorage.setItem(ACCESS_KEY, token); },
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string): void => { localStorage.setItem(REFRESH_KEY, token); },
  getUser: <T>(): T | null => {
    try { const v = localStorage.getItem(USER_KEY); return v ? JSON.parse(v) as T : null; }
    catch { return null; }
  },
  setUser: (user: unknown): void => { localStorage.setItem(USER_KEY, JSON.stringify(user)); },
  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};