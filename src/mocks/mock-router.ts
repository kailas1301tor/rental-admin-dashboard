import { ENDPOINTS } from '@/api/endpoints';
import {
  mockBookings,
  mockFlatCategories,
  mockMarketplaceUsers,
  mockPlatformAdmins,
  mockProducts,
  mockReportBookings,
  mockReportCustomers,
  mockReportOverview,
  mockReportProducts,
  mockReportRbos,
  mockReviews,
  mockRboStaff,
  mockRbos,
  mockStaff,
} from '@/mocks/marketplace';
import { buildDashboardKpisForRange } from '@/mocks/dashboard-kpis-range';
import { mockDepartments } from '@/mocks/departments';
import {
  fullManagePermissions,
  mockUserPermissions,
} from '@/mocks/permissions';
import { defaultDashboardRange } from '@/lib/date-range';
import {
  authUserFromAdmin,
  buildMockSession,
  delay,
  mockAnalytics,
  mockAuditLogs,
  mockActivityLog,
  mockCategories,
  mockContactViews,
  mockGeneralAdmins,
  mockLoginAttempts,
  mockOverrides,
  mockPlatformSummary,
  mockSettings,
} from '@/mocks/super-admin';
import type {
  AdminPermissionRow,
  AdminProfile,
  AnalyticsSummary,
  ApprovalOverrideItem,
  Category,
  CategoryNode,
  GeneralAdmin,
  MarketplaceUser,
  MarketplaceUserDetail,
  PlatformAdmin,
  PlatformAdminWrite,
  Department,
  DepartmentWrite,
  PlatformSettings,
  PlatformStaff,
  PlatformStaffWrite,
  Product,
  Review,
  RboActivityEvent,
  RboDetail,
  RboStaff,
  RboVendor,
  RboVendorMetrics,
  UserAddress,
  UserDevice,
  UserPaymentMethod,
  UserPermissions,
} from '@/types';
import { sanitizePermissions } from '@/auth/permissions';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const USER_KEY = 'rental_admin_user';

function getMockSessionUserId(): string {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return 'sa-1';
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? 'sa-1';
  } catch {
    return 'sa-1';
  }
}

function getMockSessionUserRole(): string {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return 'super_admin';
    const parsed = JSON.parse(raw) as { role?: string };
    return parsed.role ?? 'super_admin';
  } catch {
    return 'super_admin';
  }
}

function assertSuperAdmin(): void {
  if (getMockSessionUserRole() !== 'super_admin') {
    throw { message: 'Forbidden', status: 403 };
  }
}

function buildAdminProfile(userId: string): AdminProfile {
  const admin = mockPlatformAdmins.find((a) => a.id === userId);
  if (!admin) {
    throw { message: 'Profile not found', status: 404 };
  }
  const permissions =
    admin.tier === 'super_admin'
      ? fullManagePermissions()
      : { ...(mockUserPermissions[userId] ?? {}) };
  return {
    user: authUserFromAdmin(admin),
    permissions,
  };
}

function buildPermissionRows(): AdminPermissionRow[] {
  return mockPlatformAdmins
    .filter((a) => a.tier !== 'super_admin' && a.status !== 'archived')
    .map((admin) => ({
      userId: admin.id,
      name: admin.name,
      email: admin.email,
      tier: admin.tier as 'general_admin' | 'department_admin',
      departmentId: admin.departmentId,
      permissions: { ...(mockUserPermissions[admin.id] ?? {}) },
    }));
}

function buildRboMetrics(rboId: string): RboVendorMetrics {
  const bookings = mockBookings.filter((b) => b.rboId === rboId);
  const revenue = bookings.reduce((s, b) => s + b.amountInr, 0);
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const total = bookings.length || 1;
  return {
    totalBookings: bookings.length || 48,
    totalRevenueInr: revenue || 1_850_000,
    responseTimeHours: 2.4,
    completionRatePct: bookings.length
      ? Math.round((completed / total) * 1000) / 10
      : 94.2,
    cancellationRatePct: bookings.length
      ? Math.round((cancelled / total) * 1000) / 10
      : 3.8,
    deltas: {
      bookings: 18.4,
      revenue: 12.1,
      response: -8.2,
      completion: 2.4,
      cancellation: -1.1,
    },
  };
}

function buildRboActivity(vendor: RboVendor): RboActivityEvent[] {
  return [
    {
      id: `${vendor.id}-act-1`,
      title: 'New listing added',
      detail: 'A product listing was published to the marketplace.',
      actor: vendor.ownerName,
      occurredAt: '2026-07-12T09:30:00.000Z',
      tone: 'success',
    },
    {
      id: `${vendor.id}-act-2`,
      title: 'KYC documents updated',
      detail: 'Business registration and GST proof re-uploaded.',
      actor: vendor.ownerName,
      occurredAt: '2026-07-10T14:15:00.000Z',
      tone: 'accent',
    },
    {
      id: `${vendor.id}-act-3`,
      title: 'Staff member invited',
      detail: 'A new RBO staff account was created.',
      actor: 'Super Admin',
      occurredAt: '2026-07-08T11:00:00.000Z',
      tone: 'warning',
    },
    {
      id: `${vendor.id}-act-4`,
      title: 'Profile details edited',
      detail: 'Contact phone and business address updated.',
      actor: vendor.ownerName,
      occurredAt: '2026-07-05T16:40:00.000Z',
      tone: 'accent',
    },
  ];
}

function seedFromId(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n + id.charCodeAt(i) * (i + 1)) % 997;
  return n;
}

function buildUserDetail(user: MarketplaceUser): MarketplaceUserDetail {
  const seed = seedFromId(user.id);
  const rbo = user.rboId
    ? (mockRbos.find((r) => r.id === user.rboId) ?? null)
    : null;
  const altRbos = mockRbos.filter((r) => r.status === 'active').slice(0, 3);
  const rboA = rbo ?? altRbos[0] ?? mockRbos[0];
  const rboB = altRbos[1] ?? rboA;
  const rboC = altRbos[2] ?? rboA;

  const bookings = [
    {
      id: `bk-${user.id}-1`,
      productId: 'prd-1',
      rboId: rboA.id,
      customerName: user.name,
      status: 'confirmed' as const,
      amountInr: 3450 + (seed % 500),
      startAt: '2026-05-21T10:00:00.000Z',
      endAt: '2026-05-22T10:00:00.000Z',
    },
    {
      id: `bk-${user.id}-2`,
      productId: 'prd-3',
      rboId: rboB.id,
      customerName: user.name,
      status: 'completed' as const,
      amountInr: 5600 + (seed % 800),
      startAt: '2026-05-16T14:00:00.000Z',
      endAt: '2026-05-17T14:00:00.000Z',
    },
    {
      id: `bk-${user.id}-3`,
      productId: 'prd-5',
      rboId: rboC.id,
      customerName: user.name,
      status: 'completed' as const,
      amountInr: 2200 + (seed % 400),
      startAt: '2026-05-11T11:00:00.000Z',
      endAt: '2026-05-12T11:00:00.000Z',
    },
    {
      id: `bk-${user.id}-4`,
      productId: 'prd-9',
      rboId: rboB.id,
      customerName: user.name,
      status: 'cancelled' as const,
      amountInr: 4100,
      startAt: '2026-04-02T09:00:00.000Z',
      endAt: '2026-04-03T09:00:00.000Z',
    },
    {
      id: `bk-${user.id}-5`,
      productId: 'prd-10',
      rboId: rboA.id,
      customerName: user.name,
      status: 'completed' as const,
      amountInr: 8900,
      startAt: '2026-03-18T16:00:00.000Z',
      endAt: '2026-03-19T16:00:00.000Z',
    },
  ];

  const completed = bookings.filter((b) => b.status === 'completed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const upcoming = bookings.filter((b) =>
    ['pending', 'confirmed', 'processing', 'ready', 'active'].includes(b.status),
  ).length;
  const spentBookings = bookings.filter((b) => b.status !== 'cancelled');
  const totalSpentInr = spentBookings.reduce((s, b) => s + b.amountInr, 0);
  const lastTx = spentBookings[0];

  const addresses: UserAddress[] = [
    {
      id: `${user.id}-addr-1`,
      label: 'Home',
      line1: `${12 + (seed % 40)}, Park Avenue`,
      line2: 'Near City Centre',
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      isDefault: true,
    },
    {
      id: `${user.id}-addr-2`,
      label: 'Office',
      line1: `${100 + (seed % 50)}, Business Park`,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      isDefault: false,
    },
  ];

  const paymentMethods: UserPaymentMethod[] = [
    {
      id: `${user.id}-pay-1`,
      brand: 'Visa',
      last4: String(1000 + (seed % 9000)).slice(-4),
      expMonth: 8,
      expYear: 2028,
      isDefault: true,
    },
    {
      id: `${user.id}-pay-2`,
      brand: 'RuPay',
      last4: String(2000 + (seed % 8000)).slice(-4),
      expMonth: 3,
      expYear: 2027,
      isDefault: false,
    },
  ];

  const activity: RboActivityEvent[] = [
    {
      id: `${user.id}-act-1`,
      title: 'Logged in',
      detail: 'Successful login from Chrome on macOS.',
      actor: user.name,
      occurredAt: '2026-05-20T20:45:00.000Z',
      tone: 'success',
    },
    {
      id: `${user.id}-act-2`,
      title: 'Profile updated',
      detail: 'Phone number verified after OTP challenge.',
      actor: user.name,
      occurredAt: '2026-05-20T21:10:00.000Z',
      tone: 'accent',
    },
    {
      id: `${user.id}-act-3`,
      title: 'Booking placed',
      detail: `Booking ${bookings[0].id.toUpperCase()} created.`,
      actor: user.name,
      occurredAt: '2026-05-20T10:05:00.000Z',
      tone: 'warning',
    },
    {
      id: `${user.id}-act-4`,
      title: 'Payment method added',
      detail: 'Visa ending in **** linked to account.',
      actor: user.name,
      occurredAt: '2026-04-12T14:20:00.000Z',
      tone: 'accent',
    },
  ];

  const devices: UserDevice[] = [
    {
      id: `${user.id}-dev-1`,
      name: 'MacBook Pro',
      platform: 'Chrome · macOS',
      lastActiveAt: '2026-05-20T20:45:00.000Z',
      location: `${user.city}, India`,
      current: true,
    },
    {
      id: `${user.id}-dev-2`,
      name: 'iPhone 15',
      platform: 'Rental iOS',
      lastActiveAt: '2026-05-18T09:12:00.000Z',
      location: `${user.city}, India`,
      current: false,
    },
  ];

  return {
    user,
    emailVerified: true,
    phoneVerified: seed % 5 !== 0,
    role: 'customer',
    accountType: 'individual',
    lastLoginAt: '2026-05-20T20:45:00.000Z',
    updatedAt: '2026-05-20T21:10:00.000Z',
    rbo,
    bookings,
    bookingSummary: {
      total: 14 + (seed % 8),
      completed: 10 + (seed % 5),
      upcoming: Math.max(upcoming, 1),
      cancelled: Math.max(cancelled, 1),
    },
    spending: {
      totalSpentInr: 40000 + totalSpentInr,
      averageOrderInr: Math.round((40000 + totalSpentInr) / Math.max(completed + upcoming, 1)),
      lastTransactionAt: lastTx?.startAt ?? null,
      lastTransactionInr: lastTx?.amountInr ?? null,
    },
    addresses,
    paymentMethods,
    activity,
    devices,
  };
}

function matchPath(url: string, base: string): boolean {
  return url === base || url.startsWith(`${base}?`);
}

function pathId(url: string, base: string): string | null {
  if (!url.startsWith(`${base}/`)) return null;
  const rest = url.slice(base.length + 1).split('?')[0];
  const part = rest.split('/')[0];
  return part || null;
}

function queryParam(url: string, key: string): string | null {
  const q = url.includes('?') ? url.split('?')[1] : '';
  return new URLSearchParams(q).get(key);
}

export async function mockRequest<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
): Promise<T> {
  await delay();

  if (method === 'post' && matchPath(url, ENDPOINTS.authLogin)) {
    const payload = body as { email?: string; password?: string };
    if (!payload.email || !payload.password) {
      throw { message: 'Email and password are required', status: 400 };
    }
    return { otpSent: true, challengeId: 'mock-challenge' } as T;
  }

  if (method === 'post' && matchPath(url, ENDPOINTS.authVerifyOtp)) {
    const payload = body as { email?: string; otp?: string };
    if (!payload.otp || payload.otp.length < 4) {
      throw { message: 'Invalid OTP', status: 401 };
    }
    return buildMockSession(payload.email ?? 'super@platform.admin') as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.profile)) {
    return buildAdminProfile(getMockSessionUserId()) as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.adminPermissions)) {
    assertSuperAdmin();
    return buildPermissionRows() as T;
  }

  if (method === 'patch' && url.startsWith(`${ENDPOINTS.adminPermissions}/`)) {
    assertSuperAdmin();
    const userId = pathId(url, ENDPOINTS.adminPermissions);
    if (!userId) throw { message: 'User not found', status: 404 };
    const admin = mockPlatformAdmins.find((a) => a.id === userId);
    if (!admin || admin.tier === 'super_admin') {
      throw { message: 'Cannot edit permissions for this user', status: 400 };
    }
    const payload = body as { permissions?: UserPermissions };
    const next = sanitizePermissions(payload.permissions ?? {});
    mockUserPermissions[userId] = next;
    return next as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.dashboardKpis)) {
    const from = queryParam(url, 'from');
    const to = queryParam(url, 'to');
    if (from && to) {
      return buildDashboardKpisForRange(from, to) as T;
    }
    const fallback = defaultDashboardRange();
    return buildDashboardKpisForRange(fallback.from, fallback.to) as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.loginAlerts)) {
    return [...mockLoginAttempts] as T;
  }

  // --- Admins ---
  if (method === 'get' && matchPath(url, ENDPOINTS.admins)) {
    return mockPlatformAdmins.filter((a) => a.status !== 'archived') as T;
  }

  if (method === 'post' && matchPath(url, ENDPOINTS.admins)) {
    const payload = body as PlatformAdminWrite;
    if (payload.tier === 'general_admin') {
      const gas = mockPlatformAdmins.filter(
        (a) => a.tier === 'general_admin' && a.status !== 'archived',
      );
      if (gas.length >= 2) throw { message: 'Maximum of 2 General Admin slots', status: 400 };
      const slot = (payload.slot ?? ((gas.length + 1) as 1 | 2));
      if (gas.some((g) => g.slot === slot)) {
        throw { message: `General Admin slot ${slot} is taken`, status: 400 };
      }
      const created: PlatformAdmin = {
        id: `ga-${Date.now()}`,
        tier: 'general_admin',
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        status: 'active',
        slot,
        createdAt: new Date().toISOString(),
      };
      mockPlatformAdmins.push(created);
      return created as T;
    }
    if (payload.tier === 'department_admin') {
      if (!payload.departmentId) {
        throw { message: 'Department is required', status: 400 };
      }
      const dept = mockDepartments.find((d) => d.id === payload.departmentId);
      if (!dept) throw { message: 'Department not found', status: 400 };
      const taken = mockPlatformAdmins.some(
        (a) =>
          a.tier === 'department_admin' &&
          a.departmentId === payload.departmentId &&
          a.status !== 'archived',
      );
      if (taken) throw { message: 'This department already has an HOD', status: 400 };
      const created: PlatformAdmin = {
        id: `hod-${Date.now()}`,
        tier: 'department_admin',
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        status: 'active',
        departmentId: payload.departmentId,
        districtId: payload.districtId ?? 'ernakulam',
        createdAt: new Date().toISOString(),
      };
      mockPlatformAdmins.push(created);
      const depIdx = mockDepartments.findIndex((d) => d.id === payload.departmentId);
      if (depIdx >= 0) {
        mockDepartments[depIdx] = {
          ...mockDepartments[depIdx],
          hodAdminId: created.id,
        };
      }
      return created as T;
    }
    throw { message: 'Cannot create Super Admin from this panel', status: 403 };
  }

  if (
    (method === 'patch' || method === 'delete') &&
    url.startsWith(`${ENDPOINTS.admins}/`)
  ) {
    const id = pathId(url, ENDPOINTS.admins);
    const index = mockPlatformAdmins.findIndex((a) => a.id === id);
    if (index < 0) throw { message: 'Admin not found', status: 404 };
    const current = mockPlatformAdmins[index];
    if (current.tier === 'super_admin' && method === 'delete') {
      throw { message: 'Cannot archive Super Admin accounts here', status: 403 };
    }
    if (method === 'delete') {
      mockPlatformAdmins[index] = { ...current, status: 'archived' };
      return mockPlatformAdmins[index] as T;
    }
    const payload = body as Partial<PlatformAdminWrite & { status: PlatformAdmin['status'] }>;
    if (payload.tier === undefined && Object.keys(payload).length) {
      mockPlatformAdmins[index] = {
        ...current,
        name: payload.name ?? current.name,
        phone: payload.phone ?? current.phone,
        email: payload.email ?? current.email,
        address: payload.address ?? current.address,
        status: payload.status ?? current.status,
        departmentId: payload.departmentId ?? current.departmentId,
        districtId: payload.districtId ?? current.districtId,
        slot: payload.slot ?? current.slot,
      };
    }
    return mockPlatformAdmins[index] as T;
  }

  // legacy GA endpoint
  if (method === 'get' && matchPath(url, ENDPOINTS.generalAdmins)) {
    return [...mockGeneralAdmins] as T;
  }
  if (method === 'post' && matchPath(url, ENDPOINTS.generalAdmins)) {
    const payload = body as Partial<GeneralAdmin>;
    if (mockGeneralAdmins.length >= 2) {
      throw { message: 'Maximum of 2 General Admin slots', status: 400 };
    }
    const nextSlot = (mockGeneralAdmins.length + 1) as 1 | 2;
    const created: GeneralAdmin = {
      id: `ga-${Date.now()}`,
      name: payload.name ?? 'New Admin',
      email: payload.email ?? 'admin@platform.admin',
      slot: nextSlot,
      title:
        nextSlot === 1
          ? 'General Admin 1 — Security Controller'
          : 'General Admin 2 — Operations Master',
      status: 'active',
      lastActiveAt: new Date().toISOString(),
    };
    mockGeneralAdmins.push(created);
    return created as T;
  }
  if (method === 'patch' && url.startsWith(`${ENDPOINTS.generalAdmins}/`)) {
    const id = url.split('/').pop() ?? '';
    const payload = body as Partial<GeneralAdmin>;
    const index = mockGeneralAdmins.findIndex((admin) => admin.id === id);
    if (index < 0) throw { message: 'Admin not found', status: 404 };
    mockGeneralAdmins[index] = { ...mockGeneralAdmins[index], ...payload };
    return mockGeneralAdmins[index] as T;
  }

  // --- Staff ---
  if (method === 'get' && matchPath(url, ENDPOINTS.staff)) {
    return [...mockStaff] as T;
  }
  if (method === 'post' && matchPath(url, ENDPOINTS.staff)) {
    const payload = body as PlatformStaffWrite;
    const created: PlatformStaff = {
      id: `st-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      departmentId: payload.departmentId,
      districtId: payload.districtId ?? 'ernakulam',
      status: payload.status ?? 'active',
      createdAt: new Date().toISOString(),
    };
    mockStaff.push(created);
    return created as T;
  }
  if (method === 'patch' && url.startsWith(`${ENDPOINTS.staff}/`)) {
    const id = pathId(url, ENDPOINTS.staff);
    const index = mockStaff.findIndex((s) => s.id === id);
    if (index < 0) throw { message: 'Staff not found', status: 404 };
    const payload = body as Partial<PlatformStaffWrite & { status: PlatformStaff['status'] }>;
    mockStaff[index] = { ...mockStaff[index], ...payload };
    return mockStaff[index] as T;
  }

  // --- Marketplace users ---
  if (method === 'get' && matchPath(url, ENDPOINTS.users)) {
    return [...mockMarketplaceUsers] as T;
  }
  if (method === 'get' && url.startsWith(`${ENDPOINTS.users}/`)) {
    const id = pathId(url, ENDPOINTS.users);
    const user = mockMarketplaceUsers.find((u) => u.id === id);
    if (!user) throw { message: 'User not found', status: 404 };
    return buildUserDetail(user) as T;
  }
  if (method === 'patch' && url.startsWith(`${ENDPOINTS.users}/`)) {
    const id = pathId(url, ENDPOINTS.users);
    const index = mockMarketplaceUsers.findIndex((u) => u.id === id);
    if (index < 0) throw { message: 'User not found', status: 404 };
    const payload = body as Partial<Pick<MarketplaceUser, 'status'>>;
    mockMarketplaceUsers[index] = {
      ...mockMarketplaceUsers[index],
      ...payload,
    };
    return mockMarketplaceUsers[index] as T;
  }

  // --- Departments ---
  if (method === 'get' && matchPath(url, ENDPOINTS.departments)) {
    return mockDepartments.filter((d) => d.status !== 'archived') as T;
  }
  if (method === 'post' && matchPath(url, ENDPOINTS.departments)) {
    const payload = body as DepartmentWrite;
    if (!payload.name?.trim()) throw { message: 'Name is required', status: 400 };
    const created: Department = {
      id: `dep-${Date.now()}`,
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      status: payload.status ?? 'active',
      hodAdminId: payload.hodAdminId ?? null,
      createdAt: new Date().toISOString(),
    };
    mockDepartments.push(created);
    if (created.hodAdminId) {
      const adminIdx = mockPlatformAdmins.findIndex(
        (a) => a.id === created.hodAdminId,
      );
      if (adminIdx >= 0) {
        mockPlatformAdmins[adminIdx] = {
          ...mockPlatformAdmins[adminIdx],
          tier: 'department_admin',
          departmentId: created.id,
        };
      }
    }
    return created as T;
  }
  if (
    (method === 'patch' || method === 'delete') &&
    url.startsWith(`${ENDPOINTS.departments}/`)
  ) {
    const id = pathId(url, ENDPOINTS.departments);
    const index = mockDepartments.findIndex((d) => d.id === id);
    if (index < 0) throw { message: 'Department not found', status: 404 };
    const deptId = id;
    if (!deptId) throw { message: 'Department not found', status: 404 };
    if (method === 'delete') {
      const staffCount = mockStaff.filter((s) => s.departmentId === id).length;
      if (staffCount > 0) {
        throw { message: 'Cannot delete department with assigned staff', status: 400 };
      }
      mockDepartments[index] = {
        ...mockDepartments[index],
        status: 'archived',
      };
      return mockDepartments[index] as T;
    }
    const payload = body as Partial<DepartmentWrite>;
    const prev = mockDepartments[index];
    mockDepartments[index] = {
      ...prev,
      name: payload.name?.trim() ?? prev.name,
      description: payload.description ?? prev.description,
      status: payload.status ?? prev.status,
      hodAdminId:
        payload.hodAdminId !== undefined ? payload.hodAdminId : prev.hodAdminId,
    };
    if (payload.hodAdminId) {
      const adminIdx = mockPlatformAdmins.findIndex(
        (a) => a.id === payload.hodAdminId,
      );
      if (adminIdx >= 0) {
        mockPlatformAdmins[adminIdx] = {
          ...mockPlatformAdmins[adminIdx],
          tier: 'department_admin',
          departmentId: deptId,
        };
      }
    }
    return mockDepartments[index] as T;
  }

  // --- Categories ---
  if (method === 'get' && matchPath(url, ENDPOINTS.categories)) {
    return mockFlatCategories.filter((c) => c.status !== 'archived') as T;
  }
  if (method === 'post' && matchPath(url, ENDPOINTS.categories)) {
    const payload = body as Partial<Category>;
    if (!payload.name?.trim()) throw { message: 'Name is required', status: 400 };
    const parentId = payload.parentId ?? null;
    if (parentId) {
      const parent = mockFlatCategories.find((c) => c.id === parentId);
      if (!parent || parent.parentId !== null) {
        throw { message: 'Invalid parent category', status: 400 };
      }
    }
    const created: Category = {
      id: `cat-${Date.now()}`,
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      parentId,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    mockFlatCategories.push(created);
    return created as T;
  }
  if (
    (method === 'patch' || method === 'delete') &&
    url.startsWith(`${ENDPOINTS.categories}/`)
  ) {
    const id = pathId(url, ENDPOINTS.categories);
    const index = mockFlatCategories.findIndex((c) => c.id === id);
    if (index < 0) throw { message: 'Category not found', status: 404 };
    if (method === 'delete') {
      const hasChildren = mockFlatCategories.some((c) => c.parentId === id);
      if (hasChildren) {
        throw { message: 'Remove subcategories first', status: 400 };
      }
      const inUse = mockProducts.some((p) => p.categoryId === id);
      if (inUse) {
        mockFlatCategories[index] = {
          ...mockFlatCategories[index],
          status: 'archived',
        };
        return mockFlatCategories[index] as T;
      }
      mockFlatCategories.splice(index, 1);
      return { ok: true } as T;
    }
    const payload = body as Partial<Category>;
    mockFlatCategories[index] = { ...mockFlatCategories[index], ...payload };
    return mockFlatCategories[index] as T;
  }

  // legacy category schemas
  if (method === 'get' && matchPath(url, ENDPOINTS.categorySchemas)) {
    return [...mockCategories] as T;
  }
  if (method === 'patch' && url.startsWith(`${ENDPOINTS.categorySchemas}/`)) {
    const id = url.split('/').pop() ?? '';
    const payload = body as Partial<CategoryNode>;
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index < 0) throw { message: 'Category not found', status: 404 };
    mockCategories[index] = { ...mockCategories[index], ...payload };
    return mockCategories[index] as T;
  }
  if (method === 'post' && matchPath(url, ENDPOINTS.categorySchemas)) {
    const payload = body as Partial<CategoryNode>;
    const created: CategoryNode = {
      id: `cat-${Date.now()}`,
      name: payload.name ?? 'New category',
      root: payload.root ?? 'products_gadgets',
      parentId: payload.parentId ?? null,
      enabled: true,
      fieldCount: payload.fieldCount ?? 0,
    };
    mockCategories.push(created);
    return created as T;
  }

  // --- RBOs ---
  if (method === 'get' && matchPath(url, ENDPOINTS.rbos)) {
    const status = queryParam(url, 'status');
    const list = status
      ? mockRbos.filter((r) => r.status === status)
      : [...mockRbos];
    return list as T;
  }

  const rboId = pathId(url, ENDPOINTS.rbos);
  if (rboId && method === 'get' && url.startsWith(`${ENDPOINTS.rbos}/`)) {
    const nested = url.slice(ENDPOINTS.rbos.length + 1).split('?')[0].split('/');
    if (nested.length === 1) {
      const vendor = mockRbos.find((r) => r.id === rboId);
      if (!vendor) throw { message: 'RBO not found', status: 404 };
      const products = mockProducts.filter((p) => p.rboId === rboId);
      const detail: RboDetail = {
        vendor,
        products,
        staff: mockRboStaff.filter((s) => s.rboId === rboId),
        reviews: mockReviews.filter((r) => r.rboId === rboId),
        metrics: buildRboMetrics(rboId),
        activity: buildRboActivity(vendor),
        kycStatus:
          vendor.status === 'active'
            ? 'verified'
            : vendor.status === 'onboarding'
              ? 'pending'
              : 'rejected',
      };
      return detail as T;
    }
  }

  if (method === 'patch' && url.startsWith(`${ENDPOINTS.rbos}/`)) {
    const parts = url.slice(ENDPOINTS.rbos.length + 1).split('?')[0].split('/');
    const id = parts[0];
    if (parts.length === 1) {
      const index = mockRbos.findIndex((r) => r.id === id);
      if (index < 0) throw { message: 'RBO not found', status: 404 };
      const payload = body as Partial<RboVendor>;
      mockRbos[index] = { ...mockRbos[index], ...payload };
      return mockRbos[index] as T;
    }
    if (parts[1] === 'products' && parts[2]) {
      const pIdx = mockProducts.findIndex((p) => p.id === parts[2] && p.rboId === id);
      if (pIdx < 0) throw { message: 'Product not found', status: 404 };
      const payload = body as Partial<Product>;
      mockProducts[pIdx] = { ...mockProducts[pIdx], ...payload };
      return mockProducts[pIdx] as T;
    }
    if (parts[1] === 'staff' && parts[2]) {
      const sIdx = mockRboStaff.findIndex((s) => s.id === parts[2] && s.rboId === id);
      if (sIdx < 0) throw { message: 'RBO staff not found', status: 404 };
      const payload = body as Partial<RboStaff>;
      mockRboStaff[sIdx] = { ...mockRboStaff[sIdx], ...payload };
      return mockRboStaff[sIdx] as T;
    }
    if (parts[1] === 'reviews' && parts[2]) {
      const rIdx = mockReviews.findIndex((r) => r.id === parts[2] && r.rboId === id);
      if (rIdx < 0) throw { message: 'Review not found', status: 404 };
      const payload = body as Partial<Review>;
      mockReviews[rIdx] = { ...mockReviews[rIdx], ...payload };
      return mockReviews[rIdx] as T;
    }
  }

  // --- Products ---
  if (method === 'get' && matchPath(url, ENDPOINTS.products)) {
    let list = [...mockProducts];
    const rboIdQ = queryParam(url, 'rboId');
    const categoryId = queryParam(url, 'categoryId');
    const status = queryParam(url, 'status');
    const q = queryParam(url, 'q')?.toLowerCase();
    if (rboIdQ) list = list.filter((p) => p.rboId === rboIdQ);
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    if (status) list = list.filter((p) => p.status === status);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list as T;
  }

  if (method === 'get' && url.startsWith(`${ENDPOINTS.products}/`)) {
    const id = pathId(url, ENDPOINTS.products);
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw { message: 'Product not found', status: 404 };
    const rbo = mockRbos.find((r) => r.id === product.rboId);
    const category = mockFlatCategories.find((c) => c.id === product.categoryId);
    if (!rbo || !category) throw { message: 'Related data missing', status: 500 };
    const bookings = mockBookings.filter((b) => b.productId === id);
    const revenue = bookings.reduce((s, b) => s + b.amountInr, 0);
    return {
      product,
      rbo,
      category,
      reviews: mockReviews.filter((r) => r.productId === id),
      bookings,
      createdAt: '2025-02-01T00:00:00.000Z',
      updatedAt: '2026-07-10T12:00:00.000Z',
      insuranceCovered: true,
      tags: [category.name, 'Insured', 'Premium'],
      metrics: {
        bookingsDeltaPct: 18.4,
        revenueDeltaPct: 21.7,
        revenueInr: revenue || product.bookingCount * product.pricePerDayInr,
      },
      activity: [
        {
          id: `${id}-a1`,
          title: 'Product added',
          detail: 'Listing published to marketplace.',
          actor: rbo.ownerName,
          occurredAt: '2025-02-01T10:00:00.000Z',
          tone: 'success',
        },
        {
          id: `${id}-a2`,
          title: 'Details updated',
          detail: 'Price and deposit revised.',
          actor: rbo.ownerName,
          occurredAt: '2026-06-15T09:20:00.000Z',
          tone: 'accent',
        },
        {
          id: `${id}-a3`,
          title: 'Gallery updated',
          detail: 'New product photos uploaded.',
          actor: rbo.ownerName,
          occurredAt: '2026-07-01T14:00:00.000Z',
          tone: 'warning',
        },
        {
          id: `${id}-a4`,
          title: 'Status check',
          detail: 'Listing confirmed active and rentable.',
          actor: 'Super Admin',
          occurredAt: '2026-07-10T12:00:00.000Z',
          tone: 'accent',
        },
      ],
    } as T;
  }

  if (method === 'patch' && url.startsWith(`${ENDPOINTS.products}/`)) {
    const id = pathId(url, ENDPOINTS.products);
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index < 0) throw { message: 'Product not found', status: 404 };
    const payload = body as Partial<Product>;
    mockProducts[index] = { ...mockProducts[index], ...payload };
    return mockProducts[index] as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.approvalOverrides)) {
    return [...mockOverrides] as T;
  }
  if (method === 'patch' && url.startsWith(`${ENDPOINTS.approvalOverrides}/`)) {
    const id = url.split('/').pop() ?? '';
    const payload = body as Partial<ApprovalOverrideItem>;
    const index = mockOverrides.findIndex((item) => item.id === id);
    if (index < 0) throw { message: 'Override not found', status: 404 };
    mockOverrides[index] = { ...mockOverrides[index], ...payload };
    return mockOverrides[index] as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.masterAnalytics)) {
    return structuredClone(mockAnalytics) as AnalyticsSummary as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.contactViews)) {
    return [...mockContactViews] as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.auditLogs)) {
    return [...mockAuditLogs] as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.activityLog)) {
    return [...mockActivityLog] as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.platformSummary)) {
    return [...mockPlatformSummary] as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.reportOverview)) {
    return structuredClone(mockReportOverview) as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.reportBookings)) {
    return structuredClone(mockReportBookings) as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.reportProducts)) {
    return structuredClone(mockReportProducts) as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.reportRbos)) {
    return structuredClone(mockReportRbos) as T;
  }
  if (method === 'get' && matchPath(url, ENDPOINTS.reportCustomers)) {
    return [...mockReportCustomers] as T;
  }

  if (method === 'get' && matchPath(url, ENDPOINTS.settings)) {
    return { ...mockSettings } as T;
  }
  if (method === 'patch' && matchPath(url, ENDPOINTS.settings)) {
    const payload = body as Partial<PlatformSettings>;
    Object.assign(mockSettings, payload);
    return { ...mockSettings } as T;
  }

  throw {
    message: `Mock route not found: ${method.toUpperCase()} ${url}`,
    status: 404,
  };
}
