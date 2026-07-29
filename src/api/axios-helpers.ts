import { axiosClient, normalizeApiError } from '@/api/axios-client';
import { mockRequest } from '@/mocks/mock-router';

const useMocks = () => import.meta.env.VITE_USE_MOCKS !== 'false';

async function mutate<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  if (useMocks()) {
    try {
      return await mockRequest<T>(method, url, body);
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  try {
    const response = await axiosClient.request<T>({
      method,
      url,
      data: body,
    });
    return response.data;
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
  if (useMocks()) {
    return mockRequest<T>('get', url).catch((error) => {
      throw normalizeApiError(error);
    });
  }
  return axiosClient
    .get<T>(url)
    .then((r) => r.data)
    .catch((error) => {
      throw normalizeApiError(error);
    });
}
