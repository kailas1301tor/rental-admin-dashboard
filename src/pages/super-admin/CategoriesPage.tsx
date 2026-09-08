import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Package,
  Pencil,
  Plus,
  Snowflake,
  Tag,
  Trash2,
} from 'lucide-react';
import { apiDelete, apiPatch, apiPost } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { CanAccess } from '@/components/auth/CanAccess';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { filterSelectClass } from '@/components/ui/control-styles';
import { useListFilters } from '@/hooks/useListFilters';
import {
  businessTypes,
  matchesTaxonomyFilters,
  subcategories,
} from '@/lib/category-helpers';
import { matchesDistricts } from '@/lib/kerala-districts';
import { cn, formatDateTime } from '@/lib/utils';
import type { Category, Product } from '@/types';

type StatusFilter = 'all' | 'active' | 'frozen' | 'archived';
type LevelFilter = 'category' | 'subcategory';

export function CategoriesPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<Category[]>(
    ENDPOINTS.categories,
  );
  const { data: products } = useApiSWR<Product[]>(ENDPOINTS.products);
  const { filters, setFilters, reset } = useListFilters();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<LevelFilter>('subcategory');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const rows = data ?? [];
  const roots = useMemo(() => businessTypes(rows), [rows]);

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products ?? []) {
      if (!matchesDistricts(filters.districts, p.districtId)) continue;
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    }
    return map;
  }, [products, filters.districts]);

  const visibleCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of products ?? []) {
      if (!matchesDistricts(filters.districts, p.districtId)) continue;
      ids.add(p.categoryId);
      const sub = rows.find((c) => c.id === p.categoryId);
      if (sub?.parentId) ids.add(sub.parentId);
    }
    if (filters.districts.length === 0) {
      rows.forEach((c) => ids.add(c.id));
    }
    return ids;
  }, [products, filters.districts, rows]);

  const bookingTotal = useMemo(
    () =>
      (products ?? [])
        .filter((p) => matchesDistricts(filters.districts, p.districtId))
        .reduce((s, p) => s + p.bookingCount, 0),
    [products, filters.districts],
  );

  const kpis = useMemo(() => {
    const subs = subcategories(rows);
    const activeRoots = roots.filter((c) => c.status === 'active').length;
    const activeSubs = subs.filter((c) => c.status === 'active').length;
    const frozen = rows.filter((c) => c.status === 'frozen').length;
    return {
      roots: roots.length,
      activeRoots,
      subcategories: subs.length,
      activeSubs,
      frozen,
      products: [...productCounts.values()].reduce((s, n) => s + n, 0),
      bookings: bookingTotal,
    };
  }, [rows, roots, productCounts, bookingTotal]);

  const filteredRoots = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roots.filter((root) => {
      if (statusFilter !== 'all' && root.status !== statusFilter) return false;
      if (
        !matchesTaxonomyFilters(
          [root.id],
          rows,
          filters.businessCategoryIds,
        )
      ) {
        return false;
      }
      if (filters.districts.length > 0 && !visibleCategoryIds.has(root.id)) {
        const children = subcategories(rows, [root.id]);
        if (!children.some((c) => visibleCategoryIds.has(c.id))) return false;
      }
      if (!q) return true;
      const childMatch = subcategories(rows, [root.id]).some(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false),
      );
      return (
        root.name.toLowerCase().includes(q) ||
        (root.description?.toLowerCase().includes(q) ?? false) ||
        childMatch
      );
    });
  }, [
    roots,
    rows,
    query,
    statusFilter,
    filters,
    visibleCategoryIds,
  ]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate(type: LevelFilter, parent?: string) {
    setEditing(null);
    setName('');
    setDescription('');
    setLevel(type);
    setParentId(parent ?? '');
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description ?? '');
    setLevel(cat.parentId === null ? 'category' : 'subcategory');
    setParentId(cat.parentId ?? '');
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (level === 'subcategory' && !parentId && !editing?.parentId) {
      toast('Select a parent category for this subcategory', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        parentId: level === 'category' ? null : parentId || editing?.parentId,
      };
      if (editing) {
        await apiPatch(`${ENDPOINTS.categories}/${editing.id}`, payload);
        toast('Category updated', 'success');
      } else {
        await apiPost(ENDPOINTS.categories, payload);
        toast('Category created', 'success');
      }
      await mutate();
      setOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFreeze(cat: Category) {
    try {
      await apiPatch(`${ENDPOINTS.categories}/${cat.id}`, {
        status: cat.status === 'frozen' ? 'active' : 'frozen',
      });
      await mutate();
      toast(
        cat.status === 'frozen' ? 'Category enabled' : 'Category frozen',
        'success',
      );
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function onDelete() {
    if (!confirmDelete) return;
    try {
      await apiDelete(`${ENDPOINTS.categories}/${confirmDelete.id}`);
      await mutate();
      toast(
        (productCounts.get(confirmDelete.id) ?? 0) > 0
          ? 'Category archived (in use by products)'
          : 'Category deleted',
        'success',
      );
      setConfirmDelete(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !data) return <ListPageSkeleton kpiCount={3} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-1 text-sm text-text-muted">
            <span className="text-accent">Home</span>
            <span className="mx-1.5">/</span>
            <span className="text-text-primary">Categories</span>
          </nav>
          <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">
            Categories
          </h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Categories and subcategories where products are listed. Expand a
            category to manage its subcategories.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CanAccess permission="change_category">
            <Button variant="outline" onClick={() => openCreate('category')}>
              <Plus className="h-4 w-4" aria-hidden />
              Add category
            </Button>
          </CanAccess>
          <CanAccess permission="change_category">
            <Button onClick={() => openCreate('subcategory')}>
              <Plus className="h-4 w-4" aria-hidden />
              Add subcategory
            </Button>
          </CanAccess>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Categories"
          value={String(kpis.roots)}
          icon={LayoutGrid}
          hint={`${kpis.activeRoots} active`}
        />
        <KpiCard
          label="Subcategories"
          value={String(kpis.subcategories)}
          icon={Tag}
          hint={`${kpis.activeSubs} active`}
        />
        <KpiCard
          label="Products (filtered)"
          value={kpis.products.toLocaleString('en-IN')}
          icon={Package}
          hint="In matching districts"
        />
        <KpiCard
          label="Bookings (filtered)"
          value={kpis.bookings.toLocaleString('en-IN')}
          icon={Tag}
          hint={`${kpis.frozen} frozen categories`}
        />
      </div>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        categories={rows}
        search={
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories or subcategories…"
          />
        }
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={filterSelectClass}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="archived">Inactive</option>
          </select>
        </div>
      </ListFilterBar>

      {filteredRoots.length === 0 ? (
        <EmptyState
          title="No categories match filters"
          action={
            <CanAccess permission="change_category">
              <Button className="mt-3" onClick={() => openCreate('category')}>
                Add category
              </Button>
            </CanAccess>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRoots.map((root) => {
            const children = subcategories(rows, [root.id]).filter((sub) => {
              if (statusFilter !== 'all' && sub.status !== statusFilter) {
                return false;
              }
              if (
                !matchesTaxonomyFilters(
                  [sub.id, root.id],
                  rows,
                  filters.businessCategoryIds,
                )
              ) {
                return false;
              }
              if (
                filters.districts.length > 0 &&
                !visibleCategoryIds.has(sub.id)
              ) {
                return false;
              }
              const q = query.trim().toLowerCase();
              if (
                q &&
                !sub.name.toLowerCase().includes(q) &&
                !(sub.description?.toLowerCase().includes(q) ?? false) &&
                !root.name.toLowerCase().includes(q)
              ) {
                return false;
              }
              return true;
            });
            const isOpen = expanded.has(root.id);

            return (
              <Card key={root.id} className="!p-0 overflow-hidden">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(root.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-text-primary">
                          {root.name}
                        </p>
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                          Category
                        </span>
                        <StatusPill status={root.status} />
                      </div>
                      {root.description ? (
                        <p className="mt-1 text-sm text-text-secondary">
                          {root.description}
                        </p>
                      ) : null}
                      {!isOpen && children.length > 0 ? (
                        <SubcategoryChipRow items={children} />
                      ) : null}
                      <p className="mt-1 text-xs text-text-muted">
                        {children.length}{' '}
                        {children.length === 1 ? 'subcategory' : 'subcategories'}{' '}
                        · {formatDateTime(root.createdAt)}
                      </p>
                    </div>
                  </button>
                  <CategoryActions
                    cat={root}
                    onEdit={openEdit}
                    onFreeze={toggleFreeze}
                    onDelete={setConfirmDelete}
                    onAddSub={() => openCreate('subcategory', root.id)}
                    showAddSub
                  />
                </div>

                {isOpen ? (
                  <div className="border-t border-border bg-canvas/40">
                    {children.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-text-muted">
                        No subcategories yet.{' '}
                        <CanAccess permission="change_category">
                          <button
                            type="button"
                            className="text-accent hover:underline"
                            onClick={() => openCreate('subcategory', root.id)}
                          >
                            Add one
                          </button>
                        </CanAccess>
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {children.map((sub) => (
                          <li
                            key={sub.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:pl-12"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-text-primary">
                                  {sub.name}
                                </p>
                                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                                  Subcategory
                                </span>
                                <StatusPill status={sub.status} />
                              </div>
                              {sub.description ? (
                                <p className="mt-1 text-sm text-text-secondary">
                                  {sub.description}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-text-muted">
                                {productCounts.get(sub.id) ?? 0} products ·{' '}
                                {formatDateTime(sub.createdAt)}
                              </p>
                            </div>
                            <CategoryActions
                              cat={sub}
                              onEdit={openEdit}
                              onFreeze={toggleFreeze}
                              onDelete={setConfirmDelete}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          editing
            ? 'Edit category'
            : level === 'category'
              ? 'Add category'
              : 'Add subcategory'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="cat-form" isLoading={saving}>
              Save
            </Button>
          </>
        }
      >
        <form id="cat-form" className="space-y-3" onSubmit={(e) => void onSave(e)}>
          {!editing ? (
            <Select
              label="Level"
              value={level}
              onChange={(e) => {
                const next = e.target.value as LevelFilter;
                setLevel(next);
                if (next === 'category') setParentId('');
              }}
            >
              <option value="category">Category</option>
              <option value="subcategory">Subcategory</option>
            </Select>
          ) : null}
          {level === 'subcategory' ? (
            <Select
              label="Parent category"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
              disabled={Boolean(editing)}
            >
              <option value="">Select parent category</option>
              {roots
                .filter((r) => r.status !== 'archived')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </Select>
          ) : null}
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            hint="Shown under the category name in the list"
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete category?"
        description="If products use this category it will be archived instead of hard-deleted."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void onDelete()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Remove <strong>{confirmDelete?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}

function SubcategoryChipRow({ items }: { items: Category[] }) {
  const maxVisible = 8;
  const visible = items.slice(0, maxVisible);
  const overflow = items.length - visible.length;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Subcategories">
      {visible.map((sub) => (
        <span
          key={sub.id}
          className={cn(
            'inline-flex max-w-[12rem] items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
            sub.status === 'active'
              ? 'border-border bg-surface text-text-secondary'
              : sub.status === 'frozen'
                ? 'border-accent/30 bg-accent-muted/60 text-accent'
                : 'border-danger/30 bg-danger-muted/60 text-danger',
          )}
          title={sub.description ?? sub.name}
        >
          <span className="truncate">{sub.name}</span>
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex items-center rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
          +{overflow} more
        </span>
      ) : null}
    </div>
  );
}

function CategoryActions({
  cat,
  onEdit,
  onFreeze,
  onDelete,
  onAddSub,
  showAddSub,
}: {
  cat: Category;
  onEdit: (cat: Category) => void;
  onFreeze: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddSub?: () => void;
  showAddSub?: boolean;
}) {
  return (
    <CanAccess permission="change_category">
      <div className="flex flex-wrap gap-1.5">
        {showAddSub && onAddSub ? (
          <Button size="sm" variant="outline" onClick={onAddSub}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add subcategory
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => onEdit(cat)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void onFreeze(cat)}
          disabled={cat.status === 'archived'}
        >
          <Snowflake className="h-3.5 w-3.5 text-accent" aria-hidden />
          {cat.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-danger hover:border-danger"
          onClick={() => onDelete(cat)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </Button>
      </div>
    </CanAccess>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: ReactNode;
  icon: typeof LayoutGrid;
}) {
  return (
    <Card className="!p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <div className="mt-1 text-xs text-text-secondary">{hint}</div>
    </Card>
  );
}

function StatusPill({ status }: { status: Category['status'] }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'frozen'
        ? 'border-accent/30 bg-accent-muted text-accent'
        : 'border-danger/30 bg-danger-muted text-danger';
  const dot =
    status === 'active'
      ? 'bg-success'
      : status === 'frozen'
        ? 'bg-accent'
        : 'bg-danger';
  const label = status === 'archived' ? 'Inactive' : status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}
