import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiPost, apiGet } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { getStoredToken, setStoredToken } from '@/api/axios-client';
import type { AuthUser, AdminRole } from '@/types';

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
      const session = await apiPost<{ access: string; refresh: string; role?: string }>(ENDPOINTS.authVerifyOtp, {
        email,
        otp_code: otp,
      });
      setStoredToken(session.access);
      
      const profile = await apiGet<any>(ENDPOINTS.profile);
      let rawRole = (session.role || profile.role || profile.tier) as string | null;
      if (!rawRole || rawRole === 'Super Admin') rawRole = 'super_admin';
      else if (rawRole === 'General Admin') rawRole = 'general_admin';
      else if (rawRole === 'Department Admin') rawRole = 'department_admin';

      let role = rawRole;
      if (profile.tier === 'general_admin' || role === 'general_admin') {
        role = `general_admin_${profile.slot || 1}`;
      }
      
      const authUser: AuthUser = {
        id: profile.id,
        name: profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile.name,
        email: profile.email,
        role: role as AdminRole,
      };

      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setToken(session.access);
      setUser(authUser);
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
