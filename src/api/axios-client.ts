import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorShape, ApiFieldErrors } from '@/types';

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
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    // Let the browser set multipart boundary.
    delete config.headers['Content-Type'];
  }
  return config;
});

function asFieldErrors(value: unknown): ApiFieldErrors | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => typeof v === 'string' || (Array.isArray(v) && v.length > 0),
  );
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries) as ApiFieldErrors;
}

function firstFieldError(
  errors: ApiFieldErrors | undefined,
  field: string,
): string | undefined {
  const value = errors?.[field];
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim());
    return first;
  }
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function joinFieldErrors(errors: ApiFieldErrors | undefined): string | undefined {
  if (!errors) return undefined;
  const parts = Object.values(errors).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  );
  const text = parts.filter((part) => typeof part === 'string' && part.trim()).join('. ');
  return text || undefined;
}

function readErrorPayload(error: unknown): {
  message?: string;
  detail?: string;
  errors?: ApiFieldErrors;
  status?: number;
  code?: string;
} {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<Record<string, unknown>>;
    const data = ax.response?.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return {
        message: typeof data.message === 'string' ? data.message : undefined,
        detail: typeof data.detail === 'string' ? data.detail : undefined,
        errors: asFieldErrors(data.errors),
        status: ax.response?.status,
        code: ax.code,
      };
    }
    return {
      message: ax.message,
      status: ax.response?.status,
      code: ax.code,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      message: typeof record.message === 'string' ? record.message : undefined,
      detail: typeof record.detail === 'string' ? record.detail : undefined,
      errors: asFieldErrors(record.errors),
      status: typeof record.status === 'number' ? record.status : undefined,
      code: typeof record.code === 'string' ? record.code : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return {};
}

export function normalizeApiError(error: unknown): ApiErrorShape {
  const payload = readErrorPayload(error);
  return {
    message: payload.message || payload.detail || 'Something went wrong',
    status: payload.status,
    code: payload.code,
    errors: payload.errors,
  };
}

export function getErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  const fromFields = joinFieldErrors(normalized.errors);
  if (fromFields) {
    return fromFields;
  }
  return normalized.message;
}

export function getFieldError(error: unknown, field: string): string | undefined {
  return firstFieldError(normalizeApiError(error).errors, field);
}

export function getFieldErrors(error: unknown): ApiFieldErrors {
  return normalizeApiError(error).errors ?? {};
}
