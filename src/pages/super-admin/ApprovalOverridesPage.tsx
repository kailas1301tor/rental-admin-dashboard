import { useMemo, useState } from 'react';
import { apiPatch } from '@/api/axios-helpers';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { getErrorMessage } from '@/api/axios-client';
import { CanAccess } from '@/components/auth/CanAccess';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { categoryPathLabel } from '@/lib/category-helpers';
import { formatDateTime } from '@/lib/utils';
import { useListFilters } from '@/hooks/useListFilters';
import type { ApprovalOverrideItem, Category } from '@/types';

type StatusFilter = 'all' | ApprovalOverrideItem['status'];

export function ApprovalOverridesPage() {
  const { data, error, isLoading, mutate } = useApiSWR<ApprovalOverrideItem[]>(
    ENDPOINTS.approvalOverrides,
  );
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);
  const { toast } = useToast();
  const { filters, setFilters, reset, matchesDistrict, matchesTaxonomy } =
    useListFilters();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const catList = categories ?? [];

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!matchesDistrict(r.districtId)) return false;
      const categoryIds = r.categoryId ? [r.categoryId] : [];
      if (!matchesTaxonomy(categoryIds, catList)) return false;
      return true;
    });
  }, [data, filter, matchesDistrict, matchesTaxonomy, catList]);

  async function act(
    item: ApprovalOverrideItem,
    status: ApprovalOverrideItem['status'],
    note?: string,
  ) {
    setBusyId(item.id);
    try {
      await apiPatch(`${ENDPOINTS.approvalOverrides}/${item.id}`, {
        status,
        note,
      });
      await mutate();
      toast(`Marked as ${status.replace('_', ' ')}`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading && !data) return <ListPageSkeleton showKpis={false} />;
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          void mutate();
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Approval Overrides"
        description="Cross-departmental items requiring Super Admin final override."
      />
      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        categories={catList}
      />
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              'pending',
              'info_requested',
              'approved',
              'rejected',
              'all',
            ] as StatusFilter[]
          ).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? 'primary' : 'outline'}
              onClick={() => setFilter(value)}
            >
              {value.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No items in this filter" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-text-primary">
                      {item.title}
                    </h2>
                    <Badge
                      tone={
                        item.status === 'approved'
                          ? 'success'
                          : item.status === 'rejected'
                            ? 'danger'
                            : item.status === 'info_requested'
                              ? 'warning'
                              : 'accent'
                      }
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {item.listingName} ·{' '}
                    {item.categoryId
                      ? categoryPathLabel(catList, item.categoryId)
                      : '—'}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {item.department} · requested by {item.requestedBy} ·{' '}
                    {formatDateTime(item.createdAt)}
                  </p>
                  {item.note ? (
                    <p className="mt-2 rounded-lg bg-warning-muted px-3 py-2 text-xs text-text-secondary">
                      {item.note}
                    </p>
                  ) : null}
                </div>
                {item.status === 'pending' || item.status === 'info_requested' ? (
                  <CanAccess permission="change_approvaloverrideitem">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        isLoading={busyId === item.id}
                        onClick={() => {
                          void act(item, 'approved');
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={busyId === item.id}
                        onClick={() => {
                          void act(item, 'rejected');
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={busyId === item.id}
                        onClick={() => {
                          void act(
                            item,
                            'info_requested',
                            'Please provide clarifying documents',
                          );
                        }}
                      >
                        Request info
                      </Button>
                    </div>
                  </CanAccess>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
