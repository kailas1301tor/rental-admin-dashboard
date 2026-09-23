import { getErrorMessage, getFieldErrors } from '@/api/axios-client';

export type FieldErrors = Record<string, string>;

export function emptyFieldErrors(): FieldErrors {
  return {};
}

export function setFieldError(
  map: FieldErrors,
  field: string,
  message: string,
): FieldErrors {
  return { ...map, [field]: message };
}

export function clearFieldError(map: FieldErrors, field: string): FieldErrors {
  if (!(field in map)) return map;
  const next = { ...map };
  delete next[field];
  return next;
}

export function fieldErrorsFromApi(err: unknown): FieldErrors {
  const raw = getFieldErrors(err);
  const out: FieldErrors = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === 'string' && v.trim());
      if (first) out[key] = first;
    } else if (typeof value === 'string' && value.trim()) {
      out[key] = value;
    }
  }
  return out;
}

export function firstErrorMessage(
  map: FieldErrors,
  fallback = 'Please fix the highlighted fields',
): string {
  const first = Object.values(map).find((m) => m?.trim());
  return first || fallback;
}

export type RequireRule = {
  field: string;
  label?: string;
  message?: string;
  validate?: (value: unknown) => boolean;
};

export function requireFields(
  values: Record<string, unknown>,
  rules: RequireRule[],
): { fieldErrors: FieldErrors; message: string | null } {
  const fieldErrors: FieldErrors = {};
  for (const rule of rules) {
    const value = values[rule.field];
    const ok = rule.validate
      ? rule.validate(value)
      : value !== null &&
        value !== undefined &&
        String(value).trim() !== '' &&
        !(typeof value === 'number' && Number.isNaN(value));
    if (!ok) {
      fieldErrors[rule.field] =
        rule.message ??
        (rule.label ? `${rule.label} is required` : 'This field is required');
    }
  }
  const keys = Object.keys(fieldErrors);
  return {
    fieldErrors,
    message: keys.length
      ? firstErrorMessage(
          fieldErrors,
          `Please fill in ${keys.length} required field${keys.length > 1 ? 's' : ''}`,
        )
      : null,
  };
}

export function scrollToFirstError(fieldErrors: FieldErrors): void {
  const first = Object.keys(fieldErrors)[0];
  if (!first || typeof document === 'undefined') return;
  const el =
    document.querySelector(`[name="${first}"]`) ||
    document.getElementById(first) ||
    document.querySelector(`[data-field="${first}"]`);
  if (el && 'scrollIntoView' in el) {
    (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof (el as HTMLElement).focus === 'function') {
      (el as HTMLElement).focus({ preventScroll: true });
    }
  }
}

export function apiFailureFieldErrors(err: unknown): {
  fieldErrors: FieldErrors;
  message: string;
} {
  const fieldErrors = fieldErrorsFromApi(err);
  return {
    fieldErrors,
    message:
      Object.keys(fieldErrors).length > 0
        ? firstErrorMessage(fieldErrors, getErrorMessage(err))
        : getErrorMessage(err),
  };
}
