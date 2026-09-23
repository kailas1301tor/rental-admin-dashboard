import type { ReactNode } from 'react';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

function SkeletonShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function KpiRow({ count = 4 }: { count?: number }) {
  const cols =
    count >= 5
      ? 'sm:grid-cols-2 xl:grid-cols-5'
      : count === 4
        ? 'sm:grid-cols-2 xl:grid-cols-4'
        : 'sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={cn('grid grid-cols-1 gap-3', cols)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <Skeleton rounded="full" className="h-10 w-10" />
          <Skeleton className="mt-3 h-3 w-20" />
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

function FilterCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <Skeleton rounded="full" className="h-11 w-full" />
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton rounded="full" className="h-11 w-full" />
        <Skeleton rounded="full" className="h-11 w-full" />
        <Skeleton rounded="full" className="h-11 w-full" />
        <Skeleton rounded="full" className="h-11 w-full" />
      </div>
    </div>
  );
}

function TableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
      <div className="border-b border-border bg-canvas/80 px-4 py-3">
        <div className="flex gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton rounded="full" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-28 max-w-full" />
            </div>
            <Skeleton className="hidden h-3 w-24 sm:block" />
            <Skeleton rounded="full" className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCardStack({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 lg:hidden">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <Skeleton rounded="full" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 pt-1">
                <Skeleton rounded="full" className="h-6 w-16" />
                <Skeleton rounded="full" className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListPageSkeleton({
  kpiCount = 4,
  rows = 6,
  showKpis = true,
}: {
  kpiCount?: number;
  rows?: number;
  showKpis?: boolean;
}) {
  return (
    <SkeletonShell>
      <div className="space-y-2">
        <Skeleton className="hidden h-7 w-48 sm:block" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {showKpis ? <KpiRow count={kpiCount} /> : null}
      <FilterCard />
      <MobileCardStack rows={Math.min(rows, 4)} />
      <TableRows rows={rows} />
    </SkeletonShell>
  );
}

export function DetailPageSkeleton() {
  return (
    <SkeletonShell>
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton rounded="xl" className="h-24 w-24 shrink-0 sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-7 w-56 max-w-full" />
          <SkeletonText lines={2} />
          <div className="flex flex-wrap gap-2">
            <Skeleton rounded="full" className="h-7 w-20" />
            <Skeleton rounded="full" className="h-7 w-24" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="mb-4 h-4 w-32" />
          <SkeletonText lines={4} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="mb-4 h-4 w-28" />
          <SkeletonText lines={4} />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function DashboardSkeleton() {
  return (
    <SkeletonShell>
      <div className="rounded-2xl border border-border/70 bg-surface px-4 py-4 sm:border-0 sm:bg-transparent sm:p-0">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-56 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-3"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton rounded="full" className="h-8 w-8" />
            </div>
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
      <SectionSkeleton rows={3} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-border bg-surface p-4 xl:col-span-8">
          <Skeleton className="mb-4 h-4 w-40" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 xl:col-span-4">
          <Skeleton className="mb-4 h-4 w-32" />
          <SkeletonText lines={6} />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function SectionSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border border-border bg-surface p-4',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton rounded="full" className="h-9 w-28" />
        <Skeleton rounded="full" className="h-9 w-28" />
        <Skeleton rounded="full" className="h-9 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-canvas/40 p-3"
          >
            <Skeleton className="h-4 w-3/4 max-w-xs" />
            <Skeleton className="mt-2 h-3 w-1/2 max-w-[12rem]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <SkeletonShell>
      <div className="space-y-2">
        <Skeleton className="hidden h-7 w-32 sm:block" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <Skeleton rounded="xl" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-56 max-w-full" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton rounded="full" className="h-11 w-full" />
                <Skeleton rounded="full" className="h-11 w-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </SkeletonShell>
  );
}

export function ReportsSkeleton() {
  return (
    <SkeletonShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="hidden h-7 w-28 sm:block" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton rounded="full" className="h-10 w-36" />
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">
          <Skeleton rounded="full" className="h-11 w-full xl:w-40" />
          <Skeleton rounded="full" className="h-11 w-full xl:w-40" />
          <Skeleton rounded="full" className="h-11 w-full xl:w-44" />
          <Skeleton rounded="full" className="h-11 w-full xl:w-28" />
        </div>
      </div>
      <KpiRow count={4} />
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} rounded="full" className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="mb-4 h-4 w-36" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
      <TableRows rows={5} />
    </SkeletonShell>
  );
}
