import { cn } from '@/lib/utils';

export type ListingKindTab = 'all' | 'product' | 'service';

export function ListingKindTabs({
  value,
  onChange,
  className,
}: {
  value: ListingKindTab;
  onChange: (kind: ListingKindTab) => void;
  className?: string;
}) {
  const tabs: Array<{ id: ListingKindTab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'product', label: 'Products' },
    { id: 'service', label: 'Services' },
  ];

  return (
    <div className={cn('flex gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            value === tab.id
              ? 'bg-accent-muted text-text-primary ring-1 ring-accent/40'
              : 'bg-surface text-text-secondary ring-1 ring-border hover:text-text-primary',
          )}
          aria-pressed={value === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
