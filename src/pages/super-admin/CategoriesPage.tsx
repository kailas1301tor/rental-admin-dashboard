import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  LayoutGrid,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Snowflake,
  Tag,
  Trash2,
} from 'lucide-react';
import { apiDelete, apiPatch, apiPost } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  filterSelectClass,
  searchControlClass,
} from '@/components/ui/control-styles';
import { cn, formatDateTime } from '@/lib/utils';
import type { Category, Product } from '@/types';

const PAGE_SIZE = 8;

type StatusFilter = 'all' | 'active' | 'frozen' | 'archived';
type SortKey = 'newest' | 'oldest' | 'name' | 'products';

export function CategoriesPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<Category[]>(
    ENDPOINTS.categories,
  );
  const { data: products } = useApiSWR<Product[]>(ENDPOINTS.products);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products ?? []) {
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const bookingTotal = useMemo(
    () => (products ?? []).reduce((s, p) => s + p.bookingCount, 0),
    [products],
  );

  const rows = data ?? [];

  const kpis = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((c) => c.status === 'active').length;
    const frozen = rows.filter((c) => c.status === 'frozen').length;
    const inactive = rows.filter((c) => c.status === 'archived').length;
    return {
      total,
      active,
      frozen,
      inactive,
      products: products?.length ?? 0,
      frozenPct: total ? Math.round((frozen / total) * 1000) / 10 : 0,
      bookings: bookingTotal,
    };
  }, [rows, products, bookingTotal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'products') {
        return (productCounts.get(b.id) ?? 0) - (productCounts.get(a.id) ?? 0);
      }
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortKey === 'oldest' ? ta - tb : tb - ta;
    });
    return list;
  }, [rows, query, statusFilter, sortKey, productCounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  function openCreate() {
    setEditing(null);
    setName('');
    setDescription('');
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description ?? '');
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`${ENDPOINTS.categories}/${editing.id}`, {
          name,
          description,
        });
        toast('Category updated', 'success');
      } else {
        await apiPost(ENDPOINTS.categories, { name, description });
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

  function resetFilters() {
    setQuery('');
    setStatusFilter('all');
    setSortKey('newest');
    setPage(1);
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
            Create, manage, freeze or delete product categories across all RBOs.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total categories"
          value={String(kpis.total)}
          icon={LayoutGrid}
          hint={
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-success">{kpis.active} Active</span>
              <span className="text-accent">{kpis.frozen} Frozen</span>
              <span className="text-danger">{kpis.inactive} Inactive</span>
            </span>
          }
        />
        <KpiCard
          label="Total products"
          value={kpis.products.toLocaleString('en-IN')}
          icon={Package}
          hint="Across all categories"
        />
        <KpiCard
          label="Frozen categories"
          value={String(kpis.frozen)}
          icon={Snowflake}
          hint={`${kpis.frozenPct}% of total`}
        />
        <KpiCard
          label="Total bookings"
          value={kpis.bookings.toLocaleString('en-IN')}
          icon={Tag}
          hint="Across all categories"
        />
      </div>

      <Card className="!p-4">
        <div className="space-y-3">
          <label className="relative block w-full">
            <span className="sr-only">Search categories</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search categories…"
              className={searchControlClass}
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className={filterSelectClass}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
                <option value="archived">Inactive</option>
              </select>
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value as SortKey);
                  setPage(1);
                }}
                className={filterSelectClass}
              >
                <option value="newest">Sort by: Newest first</option>
                <option value="oldest">Sort by: Oldest first</option>
                <option value="name">Sort by: Name</option>
                <option value="products">Sort by: Products</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {pageRows.length === 0 ? (
        <EmptyState
          title="No categories match filters"
          actionLabel="Add category"
          onAction={openCreate}
        />
      ) : (
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Products</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((cat) => (
                <tr key={cat.id} className="hover:bg-accent-muted/30">
                  <Td>
                    <p className="font-medium text-text-primary">{cat.name}</p>
                    <p className="mt-0.5 max-w-md text-xs text-text-muted">
                      {cat.description || 'No description'}
                    </p>
                  </Td>
                  <Td className="tabular-nums">
                    {productCounts.get(cat.id) ?? 0}
                  </Td>
                  <Td>
                    <StatusPill status={cat.status} />
                  </Td>
                  <Td className="text-sm text-text-secondary">
                    {formatDateTime(cat.createdAt)}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2.5"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2.5"
                        onClick={() => void toggleFreeze(cat)}
                        disabled={cat.status === 'archived'}
                      >
                        <Snowflake className="h-3.5 w-3.5 text-accent" aria-hidden />
                        <span className="hidden sm:inline">
                          {cat.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2.5 text-danger hover:border-danger hover:text-danger"
                        onClick={() => setConfirmDelete(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-accent hover:text-text-primary"
                        aria-label={`More actions for ${cat.name}`}
                        onClick={() =>
                          toast('More actions coming soon', 'info')
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Showing {rangeStart} to {rangeEnd} of {filtered.length} categories
        </p>
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
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
  const label =
    status === 'archived' ? 'Inactive' : status;

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

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        ‹
      </Button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            'inline-flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-medium',
            p === page
              ? 'bg-accent text-text-on-accent'
              : 'text-text-secondary hover:bg-accent-muted hover:text-text-primary',
          )}
        >
          {p}
        </button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        ›
      </Button>
    </div>
  );
}
