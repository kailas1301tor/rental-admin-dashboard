import { apiGet, apiPatch } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import type { ListingDeal, ListingDealStatus } from '@/types';

export function listingDealsUrl(status?: ListingDealStatus | ''): string {
  if (!status) return ENDPOINTS.deals;
  return `${ENDPOINTS.deals}?status=${encodeURIComponent(status)}`;
}

export function listListingDeals(
  status?: ListingDealStatus | '',
): Promise<ListingDeal[]> {
  return apiGet<ListingDeal[]>(listingDealsUrl(status));
}

export function getListingDeal(id: string): Promise<ListingDeal> {
  return apiGet<ListingDeal>(`${ENDPOINTS.deals}/${id}`);
}

export function approveListingDeal(id: string): Promise<ListingDeal> {
  return apiPatch<ListingDeal>(`${ENDPOINTS.deals}/${id}`, {
    action: 'approve',
  });
}

export function rejectListingDeal(
  id: string,
  rejectionReason: string,
): Promise<ListingDeal> {
  return apiPatch<ListingDeal>(`${ENDPOINTS.deals}/${id}`, {
    action: 'reject',
    rejectionReason,
  });
}
