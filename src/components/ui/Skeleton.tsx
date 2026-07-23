import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SkeletonRounded = 'md' | 'lg' | 'xl' | 'full';

const roundedClass: Record<SkeletonRounded, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({
  className,
  rounded = 'md',
  ...props
}: HTMLAttributes<HTMLDivElement> & { rounded?: SkeletonRounded }) {
  return (
    <div
      className={cn(
        'skeleton-shimmer bg-border/50',
        roundedClass[rounded],
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}
