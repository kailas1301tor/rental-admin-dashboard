import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { useAuth } from '@/auth/AuthContext';
import type { AdminProfile, ApiErrorShape, UserPermissions } from '@/types';

interface ProfileContextValue {
  profile: AdminProfile | undefined;
  permissions: UserPermissions;
  isLoading: boolean;
  error: ApiErrorShape | undefined;
  mutate: () => Promise<AdminProfile | undefined>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate } = useApiSWR<AdminProfile>(
    isAuthenticated ? ENDPOINTS.profile : null,
  );

  const permissions = useMemo(() => data?.permissions ?? {}, [data]);

  const value = useMemo(
    () => ({
      profile: data,
      permissions,
      isLoading: isAuthenticated && isLoading && !data,
      error,
      mutate: async () => {
        const result = await mutate();
        return result;
      },
    }),
    [data, permissions, isAuthenticated, isLoading, error, mutate],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return ctx;
}

export function useProfileOptional(): ProfileContextValue | null {
  return useContext(ProfileContext);
}
