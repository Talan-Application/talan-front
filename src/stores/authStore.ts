import { create } from 'zustand';
import type { User, AuthResponse } from '../types/auth.types';
import { tokenStorage } from '../utils/token';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setAuthData: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: tokenStorage.getUser<User>(),
  isAuthenticated: !!tokenStorage.getAccess(),

  setAuthData: (data) => {
    tokenStorage.setAccess(data.access_token);
    tokenStorage.setRefresh(data.refresh_token);
    tokenStorage.setUser(data.user);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: () => {
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
