import { useMemo, useState } from 'react';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';
import { AnalyticsRow } from '@/pages/super-admin/dashboard/AnalyticsRow';
import { BottomGrid } from '@/pages/super-admin/dashboard/BottomGrid';
import { HeroRow } from '@/pages/super-admin/dashboard/HeroRow';
import { MiniStats } from '@/pages/super-admin/dashboard/MiniStats';
import {
  NeedsActionQueue,
  type NeedsTab,
} from '@/pages/super-admin/dashboard/NeedsActionQueue';
import { SparkKpis } from '@/pages/super-admin/dashboard/SparkKpis';
import type {
  ApprovalOverrideItem,
  DashboardKpis,
  LoginAttempt,
  ReportOverview,
  RboVendor,
} from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [needsTab, setNeedsTab] = useState<NeedsTab>('overrides');

  const {
    data: kpis,
    error: kpiError,
    isLoading: kpiLoading,
    mutate: mutateKpis,
  } = useApiSWR<DashboardKpis>(ENDPOINTS.dashboardKpis);
  const {
    data: alerts,
    isLoading: alertLoading,
  } = useApiSWR<LoginAttempt[]>(ENDPOINTS.loginAlerts);
  const {
    data: overrides,
    error: overrideError,
    isLoading: overrideLoading,
    mutate: mutateOverrides,
  } = useApiSWR<ApprovalOverrideItem[]>(ENDPOINTS.approvalOverrides);
  const {
    data: rbos,
    isLoading: rbosLoading,
    mutate: mutateRbos,
  } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);
  const {
    data: reportOverview,
    isLoading: overviewLoading,
  } = useApiSWR<ReportOverview>(ENDPOINTS.reportOverview);

  const pendingOverrides = useMemo(
    () => (overrides ?? []).filter((o) => o.status === 'pending'),
    [overrides],
  );
  const onboardingRbos = useMemo(
    () => (rbos ?? []).filter((r) => r.status === 'onboarding'),
    [rbos],
  );
  const securityAlerts = useMemo(
    () =>
      (alerts ?? []).filter(
        (a) => a.result === 'failed' || a.result === 'blocked',
      ),
    [alerts],
  );
  const vendorIds = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rbos ?? []) map.set(r.businessName, r.id);
    return map;
  }, [rbos]);

  async function actOverride(
    item: ApprovalOverrideItem,
    status: ApprovalOverrideItem['status'],
  ) {
    try {
      await apiPatch(`${ENDPOINTS.approvalOverrides}/${item.id}`, { status });
      await mutateOverrides();
      await mutateKpis();
      toast(`Marked as ${status.replace('_', ' ')}`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function actRbo(id: string, status: 'active' | 'rejected') {
    try {
      await apiPatch(`${ENDPOINTS.rbos}/${id}`, { status });
      await mutateRbos();
      await mutateKpis();
      toast(
        status === 'active' ? 'Vendor approved' : 'Vendor rejected',
        'success',
      );
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (kpiLoading && !kpis) return <PageLoader />;
  if (kpiError) {
    return (
      <ErrorState
        message={kpiError.message}
        onRetry={() => {
          void mutateKpis();
        }}
      />
    );
  }
  if (!kpis) return <EmptyState title="No dashboard data" />;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <div className="space-y-6">
      <HeroRow
        greeting={greeting}
        name={user?.name ?? 'Super Admin'}
        dateLabel={dateLabel}
      />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Marketplace pulse
        </h2>
        <SparkKpis kpis={kpis} />
      </section>

      <NeedsActionQueue
        tab={needsTab}
        onTabChange={setNeedsTab}
        overrides={pendingOverrides}
        overridesLoading={overrideLoading && !overrides}
        overridesError={overrideError?.message}
        onRetryOverrides={() => void mutateOverrides()}
        onOverrideAct={(item, status) => void actOverride(item, status)}
        onboarding={onboardingRbos}
        onboardingLoading={rbosLoading && !rbos}
        onRboAct={(id, status) => void actRbo(id, status)}
        security={securityAlerts}
        securityLoading={alertLoading && !alerts}
      />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Analytics
        </h2>
        <AnalyticsRow kpis={kpis} overview={reportOverview} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Platform snapshot
        </h2>
        <MiniStats kpis={kpis} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Vendors & security
        </h2>
        <BottomGrid
          kpis={kpis}
          overview={reportOverview}
          overviewLoading={overviewLoading}
          vendorIds={vendorIds}
          alerts={alerts ?? []}
          alertsLoading={alertLoading}
        />
      </section>
    </div>
  );
}
