import { useCallback, useMemo, useState } from 'react';
import { matchesDistricts } from '@/lib/kerala-districts';
import { matchesTaxonomyFilters } from '@/lib/category-helpers';
import type { Category } from '@/types';

export interface ListFiltersState {
  districts: string[];
  businessTypeIds: string[];
  businessCategoryIds: string[];
}

const EMPTY: ListFiltersState = {
  districts: [],
  businessTypeIds: [],
  businessCategoryIds: [],
};

export function useListFilters(initial?: Partial<ListFiltersState>) {
  const [filters, setFilters] = useState<ListFiltersState>({
    ...EMPTY,
    ...initial,
  });

  const reset = useCallback(() => setFilters(EMPTY), []);

  const hasActiveFilters = useMemo(
    () =>
      filters.districts.length > 0 ||
      filters.businessTypeIds.length > 0 ||
      filters.businessCategoryIds.length > 0,
    [filters],
  );

  const matchesDistrict = useCallback(
    (districtId: string | null | undefined) =>
      matchesDistricts(filters.districts, districtId),
    [filters.districts],
  );

  const matchesTaxonomy = useCallback(
    (categoryIds: string[], categories: Category[]) =>
      matchesTaxonomyFilters(
        categoryIds,
        categories,
        filters.businessTypeIds,
        filters.businessCategoryIds,
      ),
    [filters.businessTypeIds, filters.businessCategoryIds],
  );

  return {
    filters,
    setFilters,
    reset,
    hasActiveFilters,
    matchesDistrict,
    matchesTaxonomy,
  };
}
