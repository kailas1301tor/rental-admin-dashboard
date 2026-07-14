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
        'flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1',
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
              'min-h-10 rounded-lg px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-text-on-accent'
                : 'text-text-secondary hover:bg-accent-muted hover:text-text-primary',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
