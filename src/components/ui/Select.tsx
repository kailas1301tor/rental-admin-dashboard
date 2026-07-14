import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-text-primary">{label}</span>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary',
            'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
            error && 'border-danger',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <span className="text-xs text-danger">{error}</span>
        ) : hint ? (
          <span className="text-xs text-text-muted">{hint}</span>
        ) : null}
      </label>
    );
  },
);

Select.displayName = 'Select';
