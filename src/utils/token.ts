const ACCESS_KEY = 'talan_access_token';
const REFRESH_KEY = 'talan_refresh_token';

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string): void => { localStorage.setItem(ACCESS_KEY, token); },
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string): void => { localStorage.setItem(REFRESH_KEY, token); },
  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};