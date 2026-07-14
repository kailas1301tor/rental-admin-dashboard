import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
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

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
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
          alertCount={kpis?.loginAlertsToday ?? 0}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
