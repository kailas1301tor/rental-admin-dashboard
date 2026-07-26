import { filterSelectClass } from '@/components/ui/control-styles';
import { businessTypes } from '@/lib/category-helpers';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

export function BusinessTypeSelect({
  categories,
  value,
  onChange,
  className,
}: {
  categories: Category[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const roots = businessTypes(categories);

  return (
    <select
      value={value[0] ?? ''}
      onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      className={cn(filterSelectClass, className)}
      aria-label="Business type"
    >
      <option value="">All business types</option>
      {roots.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
