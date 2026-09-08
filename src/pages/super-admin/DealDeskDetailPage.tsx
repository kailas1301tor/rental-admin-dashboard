import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiPatch, apiPost } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDateTime } from '@/lib/utils';
import type {
  DealDeskInquiry,
  DealDeskMessage,
  PlatformStaff,
} from '@/types';

export function DealDeskDetailPage() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [customerReply, setCustomerReply] = useState('');
  const [vendorReply, setVendorReply] = useState('');
  const [brokerId, setBrokerId] = useState('');

  const { data: inquiry, error, isLoading, mutate } = useApiSWR<DealDeskInquiry>(
    id ? `${ENDPOINTS.dealDeskInquiries}/${id}` : null,
  );
  const { data: customerMsgs, mutate: reloadCustomer } = useApiSWR<DealDeskMessage[]>(
    id
      ? `${ENDPOINTS.dealDeskInquiries}/${id}/messages?channel=customer_broker`
      : null,
  );
  const { data: vendorMsgs, mutate: reloadVendor } = useApiSWR<DealDeskMessage[]>(
    id
      ? `${ENDPOINTS.dealDeskInquiries}/${id}/messages?channel=broker_vendor`
      : null,
  );
  const { data: staffList } = useApiSWR<PlatformStaff[]>(ENDPOINTS.staff);

  async function assignBroker() {
    if (!brokerId) return;
    try {
      await apiPatch(`${ENDPOINTS.dealDeskInquiries}/${id}`, {
        assignedBrokerId: brokerId,
        status: 'broker_active',
      });
      await mutate();
      toast('Broker assigned', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function postMessage(
    channel: DealDeskMessage['channel'],
    body: string,
    clear: () => void,
    reload: () => Promise<unknown>,
  ) {
    const text = body.trim();
    if (!text) return;
    try {
      await apiPost(`${ENDPOINTS.dealDeskInquiries}/${id}/messages`, {
        body: text,
        channel,
      });
      clear();
      await reload();
      await mutate();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !inquiry) return <DetailPageSkeleton />;
  if (error || !inquiry) {
    return (
      <ErrorState
        message={error?.message ?? 'Inquiry not found'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/deal-desk"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Deal Desk
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          {inquiry.subject}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {inquiry.listingName} · {inquiry.rboName} · {inquiry.customerMaskedLabel}
        </p>
      </div>

      <CanAccess permission="change_dealdeskinquiry">
        <Card className="!p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs font-medium text-text-muted">Assign broker</label>
              <select
                value={brokerId}
                onChange={(e) => setBrokerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="">Select broker…</option>
                {(staffList ?? [])
                  .filter((s) => s.departmentId === 'dep-deal-desk')
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>
            <Button size="sm" onClick={() => void assignBroker()} disabled={!brokerId}>
              Assign
            </Button>
          </div>
        </Card>
      </CanAccess>

      <div className="grid gap-4 lg:grid-cols-2">
        <ThreadCard
          title="Customer ↔ Broker"
          messages={customerMsgs ?? []}
          reply={customerReply}
          onReplyChange={setCustomerReply}
          onSend={() =>
            void postMessage('customer_broker', customerReply, () => setCustomerReply(''), reloadCustomer)
          }
        />
        <ThreadCard
          title="Broker ↔ Vendor"
          messages={vendorMsgs ?? []}
          reply={vendorReply}
          onReplyChange={setVendorReply}
          onSend={() =>
            void postMessage('broker_vendor', vendorReply, () => setVendorReply(''), reloadVendor)
          }
        />
      </div>
    </div>
  );
}

function ThreadCard({
  title,
  messages,
  reply,
  onReplyChange,
  onSend,
}: {
  title: string;
  messages: DealDeskMessage[];
  reply: string;
  onReplyChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <Card className="!p-4">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <div className="mt-3 space-y-3 max-h-[40vh] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'rounded-xl px-3 py-2 text-sm',
              msg.authorRole === 'system' ? 'bg-canvas text-center text-xs text-text-muted' : 'bg-canvas',
            )}
          >
            <p className="text-xs text-text-muted">
              {msg.authorName} · {formatDateTime(msg.createdAt)}
            </p>
            <p className="mt-1 text-text-primary">{msg.body}</p>
          </div>
        ))}
      </div>
      <CanAccess permission="change_dealdeskinquiry">
        <div className="mt-3 flex gap-2">
          <input
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="Broker relay message…"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <Button size="sm" onClick={onSend}>Send</Button>
        </div>
      </CanAccess>
    </Card>
  );
}
