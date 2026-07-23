import { Button } from '@/components/ui/Button';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/** @deprecated Prefer page-shaped skeletons from `@/components/ui/skeletons`. */
export function PageLoader() {
  return <ListPageSkeleton />;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-base font-medium text-text-primary">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-3" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger-muted px-6 py-10 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {/* Title lives in TopBar on small screens — avoid duplicate chrome. */}
        <h1 className="hidden text-2xl font-semibold tracking-tight text-text-primary sm:block">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-text-secondary sm:mt-1">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
