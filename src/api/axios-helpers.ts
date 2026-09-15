import { axiosClient, normalizeApiError } from '@/api/axios-client';

function unwrapData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as { success?: boolean; data?: unknown }).data !== undefined
  ) {
    return (payload as unknown as { data: T }).data;
  }
  if (
    payload &&
    typeof payload === 'object' &&
    'results' in payload &&
    (payload as { results?: { data?: unknown } }).results?.data !== undefined
  ) {
    return (payload as unknown as { results: { data: T } }).results.data;
  }
  return payload as T;
}

function toBackendUrl(url: string): string {
  return url.startsWith('/api') ? url : `/api${url}`;
}

async function mutate<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  try {
    const response = await axiosClient.request({
      method,
      url: toBackendUrl(url),
      data: body,
    });
    return unwrapData<T>(response.data);
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
  return axiosClient
    .get(toBackendUrl(url))
    .then((r) => unwrapData<T>(r.data))
    .catch((error) => {
      throw normalizeApiError(error);
    });
}
