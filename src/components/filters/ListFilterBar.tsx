import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BusinessCategorySelect } from '@/components/filters/BusinessCategorySelect';
import { BusinessTypeSelect } from '@/components/filters/BusinessTypeSelect';
import { DistrictMultiSelect } from '@/components/filters/DistrictMultiSelect';
import type { ListFiltersState } from '@/hooks/useListFilters';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

export function ListFilterBar({
  filters,
  onChange,
  onReset,
  categories = [],
  showTaxonomy = true,
  search,
  children,
  className,
}: {
  filters: ListFiltersState;
  onChange: (patch: Partial<ListFiltersState>) => void;
  onReset: () => void;
  categories?: Category[];
  showTaxonomy?: boolean;
  search?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const hasActive =
    filters.districts.length > 0 ||
    filters.businessTypeIds.length > 0 ||
    filters.businessCategoryIds.length > 0;

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4',
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {search}
        <DistrictMultiSelect
          value={filters.districts}
          onChange={(districts) => onChange({ districts })}
        />
        {showTaxonomy ? (
          <>
            <BusinessTypeSelect
              categories={categories}
              value={filters.businessTypeIds}
              onChange={(businessTypeIds) =>
                onChange({
                  businessTypeIds,
                  businessCategoryIds: [],
                })
              }
            />
            <BusinessCategorySelect
              categories={categories}
              businessTypeIds={filters.businessTypeIds}
              value={filters.businessCategoryIds}
              onChange={(businessCategoryIds) =>
                onChange({ businessCategoryIds })
              }
            />
          </>
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
