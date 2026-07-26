import { filterSelectClass } from '@/components/ui/control-styles';
import { subcategories } from '@/lib/category-helpers';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

export function BusinessCategorySelect({
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
  const options = subcategories(categories);

  return (
    <select
      value={value[0] ?? ''}
      onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      className={cn(filterSelectClass, className)}
      aria-label="Subcategory"
    >
      <option value="">All subcategories</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
