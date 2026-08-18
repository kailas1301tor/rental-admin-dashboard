import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiPost } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { getStoredToken, setStoredToken } from '@/api/axios-client';
import type { AuthSession, AuthUser } from '@/types';

const USER_KEY = 'rental_admin_user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  pendingEmail: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, captcha_token: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string, captcha_token: string) => {
    await apiPost(ENDPOINTS.authLogin, { email, password, captcha_token });
    setPendingEmail(email);
  }, []);

  const verifyOtp = useCallback(
    async (otp: string) => {
      const email = pendingEmail ?? 'super@platform.admin';
      const session = await apiPost<AuthSession>(ENDPOINTS.authVerifyOtp, {
        email,
        otp,
      });
      setStoredToken(session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      setToken(session.token);
      setUser(session.user);
      setPendingEmail(null);
    },
    [pendingEmail],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setPendingEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      pendingEmail,
      isAuthenticated: Boolean(token && user),
      login,
      verifyOtp,
      logout,
    }),
    [user, token, pendingEmail, login, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
