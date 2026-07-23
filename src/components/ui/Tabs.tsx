import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'mobile-scroll-x max-w-full flex-nowrap rounded-full border border-border/80 bg-canvas/80 p-1 shadow-inner sm:inline-flex sm:flex-wrap',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'min-h-9 shrink-0 rounded-full px-4 text-sm font-medium tracking-tight transition-all duration-200',
              active
                ? 'bg-accent text-text-on-accent shadow-sm ring-1 ring-accent/40'
                : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
