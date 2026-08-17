/** Push vendor status to Vite dev sync server (cross-port mock integration). */
import type { SupportConversation, SupportMessage } from '@/types/platform-ops';

export function pushRboDevSync(
  vendorId: string,
  status: 'active' | 'rejected' | 'frozen' | 'onboarding',
  rejectionReason?: string,
): void {
  if (!import.meta.env.DEV) return;
  fetch('/__rbo_dev_sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId, status, rejectionReason }),
  }).catch(() => {
    /* dev server may be offline */
  });
}

export function pushProductStatusDevSync(
  productId: string,
  vendorId: string,
  status: string,
  rejectionReason?: string,
): void {
  if (!import.meta.env.DEV) return;
  fetch(`/__rbo_dev_sync/products/${productId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId, status, rejectionReason }),
  }).catch(() => {
    /* dev server may be offline */
  });
}

export function pushServiceStatusDevSync(
  serviceId: string,
  vendorId: string,
  status: string,
  rejectionReason?: string,
): void {
  if (!import.meta.env.DEV) return;
  fetch(`/__rbo_dev_sync/services/${serviceId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId, status, rejectionReason }),
  }).catch(() => {
    /* dev server may be offline */
  });
}

export async function fetchDevSyncProducts(): Promise<
  Array<Record<string, unknown>>
> {
  if (!import.meta.env.DEV) return [];
  try {
    const res = await fetch('/__rbo_dev_sync/products');
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: Array<Record<string, unknown>> };
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function fetchDevSyncServices(): Promise<
  Array<Record<string, unknown>>
> {
  if (!import.meta.env.DEV) return [];
  try {
    const res = await fetch('/__rbo_dev_sync/services');
    if (!res.ok) return [];
    const data = (await res.json()) as { services?: Array<Record<string, unknown>> };
    return data.services ?? [];
  } catch {
    return [];
  }
}

export async function fetchDevSyncSupportConversations(params?: {
  participantType?: string;
  participantId?: string;
  status?: string;
}): Promise<Array<Record<string, unknown>>> {
  if (!import.meta.env.DEV) return [];
  try {
    const search = new URLSearchParams();
    if (params?.participantType) search.set('participantType', params.participantType);
    if (params?.participantId) search.set('participantId', params.participantId);
    if (params?.status) search.set('status', params.status);
    const qs = search.toString();
    const res = await fetch(
      `/__rbo_dev_sync/support/conversations${qs ? `?${qs}` : ''}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      conversations?: Array<Record<string, unknown>>;
    };
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

export async function fetchDevSyncSupportMessages(
  conversationId: string,
): Promise<Array<Record<string, unknown>>> {
  if (!import.meta.env.DEV) return [];
  try {
    const res = await fetch(
      `/__rbo_dev_sync/support/conversations/${conversationId}/messages`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      messages?: Array<Record<string, unknown>>;
    };
    return data.messages ?? [];
  } catch {
    return [];
  }
}

export function pushDevSyncSupportConversation(
  conversation: SupportConversation,
  message?: SupportMessage,
): void {
  if (!import.meta.env.DEV) return;
  fetch('/__rbo_dev_sync/support/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation, message }),
  }).catch(() => {
    /* dev server may be offline */
  });
}

export function pushDevSyncSupportMessage(
  conversationId: string,
  message: SupportMessage,
): void {
  if (!import.meta.env.DEV) return;
  fetch(`/__rbo_dev_sync/support/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }).catch(() => {
    /* dev server may be offline */
  });
}

export function patchDevSyncSupportConversation(
  conversationId: string,
  patch: Partial<SupportConversation>,
): void {
  if (!import.meta.env.DEV) return;
  fetch(`/__rbo_dev_sync/support/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => {
    /* dev server may be offline */
  });
}
