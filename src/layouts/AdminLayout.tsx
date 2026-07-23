import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { MobileBottomNav } from '@/layouts/MobileBottomNav';
import { MobileNavDrawer } from '@/layouts/MobileNavDrawer';
import { Sidebar } from '@/layouts/Sidebar';
import { TopBar } from '@/layouts/TopBar';
import { SUPER_ADMIN_NAV } from '@/layouts/nav';
import type { DashboardKpis } from '@/types';

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { data: kpis } = useApiSWR<DashboardKpis>(ENDPOINTS.dashboardKpis);

  const title = useMemo(() => {
    const exact = SUPER_ADMIN_NAV.find(
      (item) => item.end && location.pathname === item.to,
    );
    if (exact) return exact.label;
    const match = SUPER_ADMIN_NAV.find(
      (item) => !item.end && location.pathname.startsWith(item.to),
    );
    return match?.label ?? 'Super Admin';
  }, [location.pathname]);

  const navBadges = useMemo(
    () => ({
      '/login-alerts': kpis?.loginAlertsToday ?? 0,
      '/approval-overrides': kpis?.pendingOverrides ?? 0,
    }),
    [kpis?.loginAlertsToday, kpis?.pendingOverrides],
  );

  const alertCount = kpis?.loginAlertsToday ?? 0;

  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar badges={navBadges} />
        </div>
      </aside>
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        badges={navBadges}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          alertCount={alertCount}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="flex-1 px-4 pt-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-5 lg:px-6 lg:py-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav
        alertCount={alertCount}
        onMoreClick={() => setDrawerOpen(true)}
      />
    </div>
  );
}
