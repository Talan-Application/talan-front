import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, AuthResponse } from '../types/auth.types';
import { tokenStorage } from '../utils/token';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  setAuthData: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: tokenStorage.getUser<User>(),
    isAuthenticated: !!tokenStorage.getAccess(),
  }));

  const setAuthData = useCallback((data: AuthResponse): void => {
    tokenStorage.setAccess(data.access_token);
    tokenStorage.setRefresh(data.refresh_token);
    tokenStorage.setUser(data.user);
    setState({ user: data.user, isAuthenticated: true });
  }, []);

  const logout = useCallback((): void => {
    tokenStorage.clear();
    setState({ user: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuthData, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
