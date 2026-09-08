import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
import { axiosClient, normalizeApiError } from '@/api/axios-client';
import { mockRequest } from '@/mocks/mock-router';

const useMocks = () => import.meta.env.VITE_USE_MOCKS !== 'false';

const BYPASS_MOCKS = ['/admin/admins', '/admin/super-admins', '/admin/general-admins', '/admin/department-admins', '/admin/roles/dropdown', '/admin/departments', '/auth/login/step-1', '/auth/login/step-2', '/admin/profile', '/auth', '/roles/groups', '/roles/permissions', '/roles/group-permissions', '/admin/staff', '/admin/login-alerts', '/admin/login-alerts/stats', '/admin/activity-log', '/admin/users', '/admin/rbos', '/admin/listings', '/admin/products', '/admin/services'];

function shouldMock(url: string): boolean {
  if (!useMocks()) return false;
  const baseUrl = url.split('?')[0];
  return !BYPASS_MOCKS.some((bypass) => baseUrl === bypass || baseUrl.startsWith(`${bypass}/`));
}

async function apiFetcher<T>(url: string): Promise<T> {
  if (shouldMock(url)) {
    try {
      return await mockRequest<T>('get', url);
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  try {
    const backendUrl = url.startsWith('/api') ? url : `/api${url}`;
    const response = await axiosClient.get<any>(backendUrl);
    if (response.data?.success !== undefined && response.data?.data !== undefined) {
      return response.data.data as T;
    }
    if (response.data?.results?.data !== undefined) {
      return response.data.results.data as T;
    }
    return response.data as T;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function paginatedApiFetcher<T>(url: string): Promise<T> {
  if (shouldMock(url)) {
    try {
      return await mockRequest<T>('get', url);
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  try {
    const backendUrl = url.startsWith('/api') ? url : `/api${url}`;
    const response = await axiosClient.get<any>(backendUrl);
    if (response.data?.results !== undefined) {
      return response.data.results as T;
    }
    return response.data as T;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function useApiSWR<T>(
  key: string | null,
  config?: SWRConfiguration<T>,
): SWRResponse<T, ReturnType<typeof normalizeApiError>> {
  return useSWR<T, ReturnType<typeof normalizeApiError>>(key, apiFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
    ...config,
  });
}

export function usePaginatedApiSWR<T>(
  key: string | null,
  config?: SWRConfiguration<T>,
): SWRResponse<T, ReturnType<typeof normalizeApiError>> {
  return useSWR<T, ReturnType<typeof normalizeApiError>>(key, paginatedApiFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
    ...config,
  });
}
