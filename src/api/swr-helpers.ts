import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
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
  if (url.startsWith('http')) return url;
  return url.startsWith('/api') ? url : `/api${url}`;
}

async function apiFetcher<T>(url: string): Promise<T> {
  try {
    const response = await axiosClient.get(toBackendUrl(url));
    return unwrapData<T>(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function paginatedApiFetcher<T>(url: string): Promise<T> {
  try {
    const response = await axiosClient.get(toBackendUrl(url));
    if (
      response.data &&
      typeof response.data === 'object' &&
      'results' in response.data
    ) {
      return (response.data as { results: T }).results;
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
