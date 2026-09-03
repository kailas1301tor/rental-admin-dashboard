import { axiosClient, normalizeApiError } from '@/api/axios-client';
import { mockRequest } from '@/mocks/mock-router';

const useMocks = () => import.meta.env.VITE_USE_MOCKS !== 'false';

const BYPASS_MOCKS = ['/admin/admins', '/admin/super-admins', '/admin/general-admins', '/admin/department-admins', '/admin/roles/dropdown', '/admin/departments', '/auth/login/step-1', '/auth/login/step-2', '/admin/profile', '/auth', '/roles/groups', '/roles/permissions', '/roles/group-permissions', '/admin/staff', '/admin/login-alerts', '/admin/login-alerts/stats'];

function shouldMock(url: string): boolean {
  if (!useMocks()) return false;
  const baseUrl = url.split('?')[0];
  return !BYPASS_MOCKS.some((bypass) => baseUrl === bypass || baseUrl.startsWith(`${bypass}/`));
}

async function mutate<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  if (shouldMock(url)) {
    try {
      return await mockRequest<T>(method, url, body);
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  try {
    const backendUrl = url.startsWith('/api') ? url : `/api${url}`;
    const response = await axiosClient.request<any>({
      method,
      url: backendUrl,
      data: body,
    });
    if (response.data?.results?.data !== undefined) {
      return response.data.results.data as T;
    }
    return response.data as T;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return mutate<T>('post', url, body);
}

export function apiPut<T>(url: string, body?: unknown): Promise<T> {
  return mutate<T>('put', url, body);
}

export function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return mutate<T>('patch', url, body);
}

export function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  return mutate<T>('delete', url, body);
}

export function apiGet<T>(url: string): Promise<T> {
  if (shouldMock(url)) {
    return mockRequest<T>('get', url).catch((error) => {
      throw normalizeApiError(error);
    });
  }
  const backendUrl = url.startsWith('/api') ? url : `/api${url}`;
  return axiosClient
    .get<any>(backendUrl)
    .then((r) => {
      if (r.data?.results?.data !== undefined) {
        return r.data.results.data as T;
      }
      return r.data as T;
    })
    .catch((error) => {
      throw normalizeApiError(error);
    });
}
