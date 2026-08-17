import type { BookingStatus, ProductStatus, RentalRules, RboVendor } from '@/types/index';

export type ListingKind = 'product' | 'service';

export type PaymentStatus =
  | 'not_required'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

/** Rental service listing — parallel to Product in scope doc. */
export interface Service extends RentalRules {
  id: string;
  rboId: string;
  categoryId: string;
  districtId: string;
  name: string;
  description: string;
  images: string[];
  minimumDays?: number;
  videoUrl?: string;
  pricePerDayInr: number;
  depositInr: number;
  status: ProductStatus;
  ratingAvg: number;
  reviewCount: number;
  bookingCount: number;
  rejectionReason?: string;
  isHighValue?: boolean;
}

export interface ServiceDetail {
  service: Service;
  rbo: RboVendor;
  category: { id: string; name: string; root?: string };
  reviews: Array<{
    id: string;
    rating: number;
    body: string;
    author: string;
    status: string;
    createdAt: string;
  }>;
  bookings: BookingSummaryExtended[];
  createdAt: string;
  updatedAt: string;
  insuranceCovered: boolean;
  tags: string[];
  activity: Array<{
    id: string;
    title: string;
    detail: string;
    actor: string;
    occurredAt: string;
    tone: string;
  }>;
  metrics: {
    bookingsDeltaPct: number;
    revenueDeltaPct: number;
    revenueInr: number;
  };
}

export interface BookingSummaryExtended {
  id: string;
  productId?: string;
  serviceId?: string;
  listingKind: ListingKind;
  rboId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  status: BookingStatus;
  amountInr: number;
  paymentStatus?: PaymentStatus;
  startAt: string;
  endAt: string;
  updatedAt?: string;
}

export interface BookingDetail {
  booking: BookingSummaryExtended;
  product: { id: string; name: string; images: string[] } | null;
  service: { id: string; name: string; images: string[] } | null;
  rbo: RboVendor;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  } | null;
}

export type SupportParticipantType = 'customer' | 'vendor';

export type SupportConversationStatus =
  | 'open'
  | 'assigned'
  | 'resolved'
  | 'closed';

export interface SupportConversation {
  id: string;
  participantType: SupportParticipantType;
  customerId?: string | null;
  customerName?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  subject: string;
  relatedBookingId?: string;
  status: SupportConversationStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadByStaff: number;
  /** Unread count for the customer or vendor participant */
  unreadByParticipant: number;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  authorRole: 'customer' | 'vendor' | 'staff' | 'system';
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type DealDeskStatus =
  | 'open'
  | 'broker_active'
  | 'resolved'
  | 'closed';

export interface DealDeskInquiry {
  id: string;
  listingId: string;
  listingKind: ListingKind;
  listingName: string;
  rboId: string;
  rboName: string;
  customerId: string;
  customerMaskedLabel: string;
  status: DealDeskStatus;
  assignedBrokerId?: string | null;
  assignedBrokerName?: string | null;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface DealDeskMessage {
  id: string;
  inquiryId: string;
  channel: 'customer_broker' | 'broker_vendor';
  authorRole: 'customer' | 'broker' | 'vendor' | 'system';
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type PlatformNotificationAudience = 'admin' | 'vendor' | 'customer';

export interface PlatformNotification {
  id: string;
  audience: PlatformNotificationAudience;
  type: string;
  title: string;
  body: string;
  read: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface ModerationReview {
  id: string;
  productId: string;
  serviceId?: string;
  listingKind: ListingKind;
  listingName: string;
  rboId: string;
  rboName: string;
  author: string;
  targetName?: string;
  rating: number;
  body: string;
  status: 'pending_moderation' | 'visible' | 'hidden' | 'frozen';
  direction: 'received' | 'posted';
  usefulCount: number;
  reported: boolean;
  createdAt: string;
}
