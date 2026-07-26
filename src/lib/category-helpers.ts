import type { Category } from '@/types';

export function isBusinessType(category: Category): boolean {
  return category.parentId === null;
}

export function isSubcategory(category: Category): boolean {
  return category.parentId !== null;
}

export function businessTypes(categories: Category[]): Category[] {
  return categories.filter(isBusinessType);
}

export function subcategories(
  categories: Category[],
  parentIds?: string[],
): Category[] {
  const subs = categories.filter(isSubcategory);
  if (!parentIds || parentIds.length === 0) return subs;
  return subs.filter(
    (c) => c.parentId && parentIds.includes(c.parentId),
  );
}

export function categoryById(
  categories: Category[],
  id: string | null | undefined,
): Category | undefined {
  if (!id) return undefined;
  return categories.find((c) => c.id === id);
}

export function categoryPath(
  categories: Category[],
  subcategoryId: string,
): { type: Category; subcategory: Category } | null {
  const sub = categoryById(categories, subcategoryId);
  if (!sub?.parentId) return null;
  const type = categoryById(categories, sub.parentId);
  if (!type) return null;
  return { type, subcategory: sub };
}

export function categoryPathLabel(
  categories: Category[],
  subcategoryId: string,
): string {
  const path = categoryPath(categories, subcategoryId);
  if (!path) return '—';
  return `${path.type.name} › ${path.subcategory.name}`;
}

export function matchesTaxonomyFilters(
  categoryIds: string[],
  categories: Category[],
  businessTypeIds: string[],
  businessCategoryIds: string[],
): boolean {
  if (businessTypeIds.length === 0 && businessCategoryIds.length === 0) {
    return true;
  }
  if (categoryIds.length === 0) return false;

  for (const id of categoryIds) {
    const sub = categoryById(categories, id);
    if (!sub) continue;
    if (
      businessCategoryIds.length > 0 &&
      businessCategoryIds.includes(id)
    ) {
      return true;
    }
    if (businessTypeIds.length > 0 && sub.parentId) {
      if (businessTypeIds.includes(sub.parentId)) return true;
    }
    if (businessTypeIds.length > 0 && sub.parentId === null) {
      if (businessTypeIds.includes(id)) return true;
    }
  }
  return false;
}
