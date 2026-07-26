export type AdminRole = 'super_admin' | 'general_admin_1' | 'general_admin_2';

export type ThemeMode = 'light' | 'dark' | 'system';

export type LoaderStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export type AdminTier = 'super_admin' | 'general_admin' | 'department_admin';

/** @deprecated Use departmentId on PlatformAdmin / PlatformStaff */
export type HodDepartment =
  | 'onboarding_compliance_marketing'
  | 'user_verification'
  | 'operations'
  | 'deal_desk'
  | 'technical'
  | 'accounts'
  | 'audit';

export interface Department {
  id: string;
  name: string;
  description?: string;
  status: EntityStatus | 'archived';
  hodAdminId?: string | null;
  createdAt: string;
}

export interface DepartmentWrite {
  name: string;
  description?: string;
  status?: EntityStatus | 'archived';
  hodAdminId?: string | null;
}

export type EntityStatus = 'active' | 'frozen';
export type AdminStatus = 'active' | 'frozen' | 'archived';
export type RboStatus = 'active' | 'onboarding' | 'rejected' | 'frozen';
export type ProductStatus = 'active' | 'frozen' | 'disabled';
export type ReviewStatus = 'visible' | 'hidden' | 'frozen';
export type MarketplaceUserStatus = 'active' | 'inactive';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface MetricSpark {
  deltaPct: number;
  sparkline: number[];
}

export interface DashboardMiniStats {
  totalUsers: number;
  newRegistrations: number;
  completedBookings: number;
  pendingPayments: number;
  totalVendors: number;
  avgRating: number;
  deltas: {
    totalUsers: number;
    newRegistrations: number;
    completedBookings: number;
    pendingPayments: number;
    totalVendors: number;
    avgRating: number;
  };
}

export interface DashboardKpis {
  vendors: number;
  pendingListings: number;
  activeBookings: number;
  revenueInr: number;
  pendingOverrides: number;
  loginAlertsToday: number;
  cancellationsLast7Days: number;
  activeVendors: number;
  rbosOnboarding: number;
  rbosFrozen: number;
  failedLoginsToday: number;
  platformHealthPct: number;
  platformHealthLabel: string;
  sparks: {
    bookingValue: MetricSpark;
    activeRentals: MetricSpark;
    cancellations: MetricSpark;
    activeVendors: MetricSpark;
  };
  miniStats: DashboardMiniStats;
  bookingsTrend: { label: string; count: number }[];
  bookingsTrendDeltaPct: number;
  monthBookingSeries: { label: string; gmvInr: number }[];
  moneyMix: { name: string; value: number }[];
  calendarActiveDays: number[];
  calendarYear: number;
  calendarMonth: number;
}

export interface LoginAttempt {
  id: string;
  userName: string;
  role: string;
  ip: string;
  location: string;
  districtId?: string;
  result: 'success' | 'failed' | 'blocked';
  emailAlertSent: boolean;
  attemptedAt: string;
}

/** @deprecated Use PlatformAdmin */
export interface GeneralAdmin {
  id: string;
  name: string;
  email: string;
  slot: 1 | 2;
  title: string;
  status: 'active' | 'frozen';
  lastActiveAt: string;
}

export interface PlatformAdmin {
  id: string;
  tier: AdminTier;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: AdminStatus;
  slot?: 1 | 2;
  departmentId?: string;
  districtId?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface PlatformAdminWrite {
  tier: 'general_admin' | 'department_admin';
  name: string;
  phone: string;
  email: string;
  address: string;
  password?: string;
  slot?: 1 | 2;
  departmentId?: string;
  districtId?: string;
  status?: AdminStatus;
}

export interface PlatformStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  districtId: string;
  status: EntityStatus;
  createdAt: string;
}

export interface PlatformStaffWrite {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  districtId?: string;
  status?: EntityStatus;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  status: EntityStatus | 'archived';
  createdAt: string;
}

/** @deprecated Use Category */
export type TaxonomyRoot =
  | 'products_gadgets'
  | 'properties_spaces'
  | 'human_resources'
  | 'sales_booking';

/** @deprecated Use Category */
export interface CategoryNode {
  id: string;
  name: string;
  root: TaxonomyRoot;
  parentId: string | null;
  enabled: boolean;
  fieldCount: number;
}

export interface RboVendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  districtId: string;
  status: RboStatus;
  categoryIds: string[];
  ratingAvg: number;
  createdAt: string;
}

/** End-customer / app user (not platform admin staff). */
export interface MarketplaceUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  districtId: string;
  rboId: string | null;
  status: MarketplaceUserStatus;
  joinedAt: string;
}

export interface UserAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface UserPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface UserDevice {
  id: string;
  name: string;
  platform: string;
  lastActiveAt: string;
  location: string;
  current: boolean;
}

export interface MarketplaceUserDetail {
  user: MarketplaceUser;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'customer';
  accountType: 'individual' | 'business';
  lastLoginAt: string;
  updatedAt: string;
  rbo: RboVendor | null;
  bookings: BookingSummary[];
  bookingSummary: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
  spending: {
    totalSpentInr: number;
    averageOrderInr: number;
    lastTransactionAt: string | null;
    lastTransactionInr: number | null;
  };
  addresses: UserAddress[];
  paymentMethods: UserPaymentMethod[];
  activity: RboActivityEvent[];
  devices: UserDevice[];
}

export interface RboStaff {
  id: string;
  rboId: string;
  name: string;
  phone: string;
  status: EntityStatus;
}

export interface Product {
  id: string;
  rboId: string;
  categoryId: string;
  districtId: string;
  name: string;
  description: string;
  images: string[];
  videoUrl?: string;
  pricePerDayInr: number;
  depositInr: number;
  status: ProductStatus;
  ratingAvg: number;
  reviewCount: number;
  bookingCount: number;
}

export type ReviewDirection = 'received' | 'posted';

export interface Review {
  id: string;
  productId: string;
  rboId: string;
  author: string;
  targetName?: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  direction: ReviewDirection;
  createdAt: string;
}

export interface BookingSummary {
  id: string;
  productId: string;
  rboId: string;
  customerName: string;
  status: BookingStatus;
  amountInr: number;
  startAt: string;
  endAt: string;
}

export interface RboVendorMetrics {
  totalBookings: number;
  totalRevenueInr: number;
  responseTimeHours: number;
  completionRatePct: number;
  cancellationRatePct: number;
  deltas: {
    bookings: number;
    revenue: number;
    response: number;
    completion: number;
    cancellation: number;
  };
}

export interface RboActivityEvent {
  id: string;
  title: string;
  detail: string;
  actor: string;
  occurredAt: string;
  tone: 'accent' | 'success' | 'warning' | 'danger';
}

export interface RboDetail {
  vendor: RboVendor;
  products: Product[];
  staff: RboStaff[];
  reviews: Review[];
  metrics: RboVendorMetrics;
  activity: RboActivityEvent[];
  kycStatus: 'verified' | 'pending' | 'rejected';
}

export interface ProductDetail {
  product: Product;
  rbo: RboVendor;
  category: Category;
  reviews: Review[];
  bookings: BookingSummary[];
  createdAt: string;
  updatedAt: string;
  insuranceCovered: boolean;
  tags: string[];
  activity: RboActivityEvent[];
  metrics: {
    bookingsDeltaPct: number;
    revenueDeltaPct: number;
    revenueInr: number;
  };
}

export interface ApprovalOverrideItem {
  id: string;
  title: string;
  department: string;
  requestedBy: string;
  listingName: string;
  categoryRoot: TaxonomyRoot;
  categoryId?: string;
  districtId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  createdAt: string;
  note?: string;
}

export interface AnalyticsPoint {
  label: string;
  gmvInr: number;
  activeRentals: number;
  listings: number;
}

export interface AnalyticsSummary {
  series: AnalyticsPoint[];
  byRoot: { root: TaxonomyRoot; label: string; listings: number; gmvInr: number }[];
}

export interface ContactViewRow {
  id: string;
  viewedAt: string;
  viewerName: string;
  area: string;
  categoryRoot: TaxonomyRoot;
  listingName: string;
  vendorName: string;
}

export interface AuditLogRow {
  id: string;
  occurredAt: string;
  actor: string;
  actorRole: string;
  action: string;
  entity: string;
  entityType: string;
}

export type ActivityLogRole =
  | 'super_admin'
  | 'general_admin'
  | 'staff'
  | 'rbo'
  | 'customer';

export type ActivityLogActionKind =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'booking_created'
  | 'login'
  | 'logout'
  | 'approved'
  | 'rejected'
  | 'viewed';

export type ActivityLogStatus = 'success' | 'failed' | 'info';

export type ActivityLogModule =
  | 'Admins'
  | 'RBOs'
  | 'Staff'
  | 'Bookings'
  | 'Products'
  | 'Users'
  | 'Categories'
  | 'Authentication'
  | 'Settings'
  | 'Approvals';

export interface ActivityLogEntry {
  id: string;
  occurredAt: string;
  userName: string;
  userEmail: string;
  role: ActivityLogRole;
  actionKind: ActivityLogActionKind;
  actionLabel: string;
  module: ActivityLogModule;
  details: string;
  status: ActivityLogStatus;
  ipAddress: string;
  location: string;
  districtId?: string;
  categoryId?: string;
}

export interface PlatformSummaryRow {
  root: TaxonomyRoot;
  label: string;
  listings: number;
  bookings: number;
  gmvInr: number;
}

export interface PlatformSettings {
  sessionTimeoutMinutes: number;
  mfaChannel: 'sms' | 'email' | 'both';
  captchaEnabled: boolean;
  loginAlertsEnabled: boolean;
  loginAlertRecipients: string;
  loginAlertRetentionDays: number;
  listingFeeDefaultInr: number;
  commissionDefaultPct: number;
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  language: AppLanguage;
  currency: AppCurrency;
  dateFormat: DateFormatPref;
  themeMode: ThemeMode;
  accentColor: AccentColorId;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  marketingEmails: boolean;
}

export type AppLanguage = 'en' | 'hi';
export type AppCurrency = 'INR' | 'USD' | 'AED' | 'EUR';
export type DateFormatPref =
  | 'dd_mmm_yyyy'
  | 'dd_mm_yyyy'
  | 'mm_dd_yyyy'
  | 'yyyy_mm_dd';
export type AccentColorId =
  | 'gold'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'green'
  | 'orange'
  | 'red';

export interface ReportOverview {
  kpis: {
    gmvInr: number;
    bookings: number;
    completedBookings: number;
    cancellations: number;
    activeRentals: number;
    avgRating: number;
    deltas: {
      gmvPct: number;
      bookingsPct: number;
      completedPct: number;
      cancellationsPct: number;
      activeRentalsPct: number;
      avgRatingPts: number;
    };
  };
  salesByCategory: { name: string; value: number }[];
  gmvSeries: { label: string; gmvInr: number }[];
  topRbos: { name: string; gmvInr: number }[];
  bookingsByStatus: {
    name: string;
    value: number;
    pct: number;
    color: string;
  }[];
  topCategories: {
    name: string;
    bookings: number;
    gmvInr: number;
    changePct: number;
  }[];
  recentActivity: {
    id: string;
    customerName: string;
    bookingId: string;
    status: 'Completed' | 'Confirmed' | 'Cancelled' | 'Pending' | 'Rejected';
    amountInr: number;
    occurredAt: string;
  }[];
}

export interface ReportBookings {
  byStatus: { name: string; value: number }[];
  cancellationSeries: { label: string; count: number }[];
  volumeSeries: { label: string; count: number }[];
}

export interface ReportProducts {
  topByGmv: { id: string; name: string; gmvInr: number; ratingAvg: number }[];
  negativeReview: { id: string; name: string; ratingAvg: number; reviewCount: number }[];
  highReview: { id: string; name: string; ratingAvg: number; reviewCount: number }[];
}

export interface ReportRbos {
  leaderboard: { id: string; name: string; gmvInr: number; ratingAvg: number }[];
  badReview: { id: string; name: string; ratingAvg: number }[];
  goodReview: { id: string; name: string; ratingAvg: number }[];
}

export interface ReportCustomer {
  id: string;
  name: string;
  negativeReviews: number;
  riskScore: number;
  flag: string;
  lastIncidentAt: string;
}

export interface ApiErrorShape {
  message: string;
  status?: number;
  code?: string;
}
