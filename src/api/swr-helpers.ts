import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
import { axiosClient, normalizeApiError } from '@/api/axios-client';
import { mockRequest } from '@/mocks/mock-router';

const useMocks = () => import.meta.env.VITE_USE_MOCKS !== 'false';

async function apiFetcher<T>(url: string): Promise<T> {
  if (useMocks()) {
    try {
      return await mockRequest<T>('get', url);
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  try {
    const response = await axiosClient.get<T>(url);
    return response.data;
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
    ...config,
  });
}
