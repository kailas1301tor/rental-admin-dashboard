import { forwardRef, type InputHTMLAttributes } from 'react';
import { controlClass } from '@/components/ui/control-styles';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-text-primary">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            controlClass,
            'w-full placeholder:text-text-muted',
            error && 'border-danger',
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-danger">{error}</span>
        ) : hint ? (
          <span className="text-xs text-text-muted">{hint}</span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
