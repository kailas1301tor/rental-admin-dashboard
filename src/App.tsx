import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { AuthProvider } from '@/auth/AuthContext';
import { ProfileProvider } from '@/auth/ProfileProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequirePermission } from '@/auth/RequirePermission';
import { ToastProvider } from '@/components/ui/Toast';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OtpPage } from '@/pages/auth/OtpPage';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';
import { AdminsPage } from '@/pages/super-admin/AdminsPage';
import { ApprovalOverridesPage } from '@/pages/super-admin/ApprovalOverridesPage';
import { CategoriesPage } from '@/pages/super-admin/CategoriesPage';
import { DashboardPage } from '@/pages/super-admin/DashboardPage';
import { DepartmentsPage } from '@/pages/super-admin/DepartmentsPage';
import { LoginAlertsPage } from '@/pages/super-admin/LoginAlertsPage';
import { PermissionsPage } from '@/pages/super-admin/PermissionsPage';
import { ProductDetailPage } from '@/pages/super-admin/ProductDetailPage';
import { ProductsPage } from '@/pages/super-admin/ProductsPage';
import { RboDetailPage } from '@/pages/super-admin/RboDetailPage';
import { RbosPage } from '@/pages/super-admin/RbosPage';
import { ReportsPage } from '@/pages/super-admin/ReportsPage';
import { SettingsPage } from '@/pages/super-admin/SettingsPage';
import { StaffPage } from '@/pages/super-admin/StaffPage';
import { UsersPage } from '@/pages/super-admin/UsersPage';
import { UserDetailPage } from '@/pages/super-admin/UserDetailPage';
import { ActivityLogPage } from '@/pages/super-admin/ActivityLogPage';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PreferencesProvider } from '@/preferences/PreferencesProvider';

function Guard({
  module,
  superAdminOnly,
  children,
}: {
  module?: Parameters<typeof RequirePermission>[0]['module'];
  superAdminOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <RequirePermission module={module} superAdminOnly={superAdminOnly}>
      {children}
    </RequirePermission>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <ToastProvider>
          <AuthProvider>
            <ProfileProvider>
              <SWRConfig value={{ provider: () => new Map() }}>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/otp" element={<OtpPage />} />
                    <Route
                      element={
                        <RequireAuth>
                          <AdminLayout />
                        </RequireAuth>
                      }
                    >
                      <Route
                        index
                        element={
                          <Guard module="dashboard">
                            <DashboardPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="admins"
                        element={
                          <Guard module="admins">
                            <AdminsPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="staff"
                        element={
                          <Guard module="staff">
                            <StaffPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="departments"
                        element={
                          <Guard module="departments">
                            <DepartmentsPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="rbos"
                        element={
                          <Guard module="rbos">
                            <RbosPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="rbos/:id"
                        element={
                          <Guard module="rbos">
                            <RboDetailPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="products"
                        element={
                          <Guard module="products">
                            <ProductsPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="products/:id"
                        element={
                          <Guard module="products">
                            <ProductDetailPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="categories"
                        element={
                          <Guard module="categories">
                            <CategoriesPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="users"
                        element={
                          <Guard module="users">
                            <UsersPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="users/:id"
                        element={
                          <Guard module="users">
                            <UserDetailPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="login-alerts"
                        element={
                          <Guard module="login_alerts">
                            <LoginAlertsPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="approval-overrides"
                        element={
                          <Guard module="approval_overrides">
                            <ApprovalOverridesPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="reports"
                        element={
                          <Guard module="reports">
                            <ReportsPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="activity-log"
                        element={
                          <Guard module="activity_log">
                            <ActivityLogPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="settings"
                        element={
                          <Guard module="settings">
                            <SettingsPage />
                          </Guard>
                        }
                      />
                      <Route
                        path="permissions"
                        element={
                          <Guard superAdminOnly>
                            <PermissionsPage />
                          </Guard>
                        }
                      />
                      <Route path="unauthorized" element={<UnauthorizedPage />} />
                      <Route
                        path="analytics"
                        element={<Navigate to="/reports" replace />}
                      />
                      <Route
                        path="general-admins"
                        element={<Navigate to="/admins" replace />}
                      />
                      <Route
                        path="category-schemas"
                        element={<Navigate to="/categories" replace />}
                      />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </SWRConfig>
            </ProfileProvider>
          </AuthProvider>
        </ToastProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
