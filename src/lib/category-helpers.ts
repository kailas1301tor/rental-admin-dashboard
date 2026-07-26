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
  businessCategoryIds: string[],
): boolean {
  if (businessCategoryIds.length === 0) {
    return true;
  }
  if (categoryIds.length === 0) return false;

  for (const id of categoryIds) {
    const cat = categoryById(categories, id);
    if (!cat) continue;
    if (businessCategoryIds.includes(id)) return true;
    if (cat.parentId === null) {
      const hasMatchingChild = businessCategoryIds.some((cid) => {
        const sub = categoryById(categories, cid);
        return sub?.parentId === id;
      });
      if (hasMatchingChild) return true;
    }
  }
  return false;
}
