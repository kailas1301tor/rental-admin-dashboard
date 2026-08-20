import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorShape } from '@/types';

const AUTH_TOKEN_KEY = 'rental_admin_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function normalizeApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string; detail?: string; errors?: Record<string, any> }>;
    const data = ax.response?.data;
    
    let extractedError = '';
    if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey) {
        const errorVal = data.errors[firstKey];
        if (Array.isArray(errorVal) && errorVal.length > 0) {
          extractedError = String(errorVal[0]);
        } else if (typeof errorVal === 'string') {
          extractedError = errorVal;
        }
      }
    }

    const message =
      extractedError ||
      data?.message ||
      data?.detail ||
      ax.message ||
      'Something went wrong';
    return {
      message,
      status: ax.response?.status,
      code: ax.code,
    };
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    const shaped = error as { message: string; status?: number; code?: string };
    return {
      message: shaped.message,
      status: shaped.status,
      code: shaped.code,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Unexpected error' };
}

export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
