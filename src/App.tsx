import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/auth/RequireAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OtpPage } from '@/pages/auth/OtpPage';
import { AdminsPage } from '@/pages/super-admin/AdminsPage';
import { ApprovalOverridesPage } from '@/pages/super-admin/ApprovalOverridesPage';
import { CategoriesPage } from '@/pages/super-admin/CategoriesPage';
import { DashboardPage } from '@/pages/super-admin/DashboardPage';
import { DepartmentsPage } from '@/pages/super-admin/DepartmentsPage';
import { LoginAlertsPage } from '@/pages/super-admin/LoginAlertsPage';
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

export default function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <ToastProvider>
          <AuthProvider>
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
                    <Route index element={<DashboardPage />} />
                    <Route path="admins" element={<AdminsPage />} />
                    <Route path="staff" element={<StaffPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="rbos" element={<RbosPage />} />
                    <Route path="rbos/:id" element={<RboDetailPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/:id" element={<ProductDetailPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="users/:id" element={<UserDetailPage />} />
                    <Route path="login-alerts" element={<LoginAlertsPage />} />
                    <Route
                      path="approval-overrides"
                      element={<ApprovalOverridesPage />}
                    />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="activity-log" element={<ActivityLogPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="analytics" element={<Navigate to="/reports" replace />} />
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
          </AuthProvider>
        </ToastProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
