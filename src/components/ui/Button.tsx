import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-accent text-text-on-accent hover:bg-accent-hover shadow-sm disabled:opacity-50',
  secondary:
    'bg-surface-elevated text-text-primary border border-border hover:bg-accent-muted',
  ghost: 'bg-transparent text-text-secondary hover:bg-accent-muted hover:text-text-primary',
  danger: 'bg-danger text-white hover:opacity-90',
  outline:
    'border border-border-strong bg-transparent text-text-primary hover:border-accent hover:text-accent',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  ),
);

Button.displayName = 'Button';
