import { useMemo, useState } from 'react';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import {
  buildDateRangeQuery,
  defaultDashboardRange,
  type DateRange,
} from '@/lib/date-range';
import { useApiSWR } from '@/api/swr-helpers';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { AnalyticsRow } from '@/pages/super-admin/dashboard/AnalyticsRow';
import { DashboardDateRangeFilter } from '@/pages/super-admin/dashboard/DashboardDateRangeFilter';
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
  RboRejectionCode,
  RboVendor,
} from '@/types';
import { RBO_REJECTION_CODES } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [needsTab, setNeedsTab] = useState<NeedsTab>('overrides');
  const [appliedRange, setAppliedRange] = useState<DateRange>(() =>
    defaultDashboardRange(),
  );
  const [rejectVendorId, setRejectVendorId] = useState<string | null>(null);
  const [rejectionCode, setRejectionCode] = useState<RboRejectionCode>('gst_invalid');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const kpiKey = `${ENDPOINTS.dashboardKpis}${buildDateRangeQuery(
    appliedRange.from,
    appliedRange.to,
  )}`;

  const {
    data: kpis,
    error: kpiError,
    isLoading: kpiLoading,
    mutate: mutateKpis,
  } = useApiSWR<DashboardKpis>(kpiKey);
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
    () =>
      (rbos ?? [])
        .filter((r) => r.status === 'onboarding')
        .sort((a, b) => {
          const aT = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const bT = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return bT - aT;
        }),
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

  async function actRbo(
    id: string,
    status: 'active' | 'rejected',
    extra?: { rejectionCode?: string; rejectionReason?: string },
  ) {
    if (status === 'rejected' && !extra?.rejectionCode) {
      setRejectVendorId(id);
      setRejectionCode('gst_invalid');
      setRejectionReason('');
      return;
    }
    try {
      await apiPatch(`${ENDPOINTS.rbos}/${id}`, { status, ...extra });
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

  async function confirmDashboardReject() {
    if (!rejectVendorId || !rejectionCode) return;
    setRejecting(true);
    try {
      await actRbo(rejectVendorId, 'rejected', {
        rejectionCode,
        rejectionReason: rejectionReason.trim() || undefined,
      });
      setRejectVendorId(null);
    } finally {
      setRejecting(false);
    }
  }

  if (kpiLoading && !kpis) return <DashboardSkeleton />;
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <HeroRow
          greeting={greeting}
          name={user?.name ?? 'Super Admin'}
          dateLabel={dateLabel}
        />
        <DashboardDateRangeFilter
          range={appliedRange}
          onRangeChange={setAppliedRange}
        />
      </div>

      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted sm:text-xs">
          Marketplace pulse
        </h2>
        <SparkKpis
          kpis={kpis}
          rangeFrom={appliedRange.from}
          rangeTo={appliedRange.to}
        />
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
        onRboAct={(id, status, extra) => void actRbo(id, status, extra)}
        security={securityAlerts}
        securityLoading={alertLoading && !alerts}
      />

      <Modal
        open={Boolean(rejectVendorId)}
        title="Reject RBO application"
        description="Select a reason code. Optional notes are shown to the vendor."
        onClose={() => setRejectVendorId(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectVendorId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={rejecting}
              onClick={() => void confirmDashboardReject()}
            >
              {rejecting ? 'Rejecting…' : 'Confirm reject'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Rejection code"
            value={rejectionCode}
            onChange={(e) =>
              setRejectionCode(e.target.value as RboRejectionCode)
            }
          >
            {RBO_REJECTION_CODES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            label="Additional notes (optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Shown to the vendor on the rejection screen"
          />
        </div>
      </Modal>

      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted sm:text-xs">
          Platform snapshot
        </h2>
        <MiniStats kpis={kpis} />
      </section>

      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted sm:text-xs">
          Analytics
        </h2>
        <AnalyticsRow
          kpis={kpis}
          overview={reportOverview}
          rangeFrom={appliedRange.from}
          rangeTo={appliedRange.to}
        />
      </section>

      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted sm:text-xs">
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
