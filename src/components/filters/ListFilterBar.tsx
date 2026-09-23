import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BusinessCategorySelect } from '@/components/filters/BusinessCategorySelect';
import { DistrictMultiSelect } from '@/components/filters/DistrictMultiSelect';
import type { ListFiltersState } from '@/hooks/useListFilters';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function ListFilterBar({
  filters,
  onChange,
  onReset,
  categories = [],
  showDistrict = true,
  showTaxonomy = true,
  search,
  children,
  className,
}: {
  filters: ListFiltersState;
  onChange: (patch: Partial<ListFiltersState>) => void;
  onReset: () => void;
  categories?: Category[];
  showDistrict?: boolean;
  showTaxonomy?: boolean;
  search?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const hasActive =
    (showDistrict && filters.districts.length > 0) ||
    filters.businessCategoryIds.length > 0;

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4',
        className,
      )}
    >
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        {search}
        {showDistrict ? (
          <FilterField label="District">
            <DistrictMultiSelect
              value={filters.districts}
              onChange={(districts) => onChange({ districts })}
            />
          </FilterField>
        ) : null}
        {showTaxonomy ? (
          <FilterField label="Subcategory">
            <BusinessCategorySelect
              categories={categories}
              value={filters.businessCategoryIds}
              onChange={(businessCategoryIds) =>
                onChange({ businessCategoryIds })
              }
            />
          </FilterField>
        ) : null}
        {children}
      </div>
      {hasActive ? (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
