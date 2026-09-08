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
import type { PlatformStaff, SupportConversation, SupportMessage } from '@/types';

export function SupportDetailPage() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [reply, setReply] = useState('');
  const [staffId, setStaffId] = useState('');

  const { data: conv, error, isLoading, mutate } = useApiSWR<SupportConversation>(
    id ? `${ENDPOINTS.supportConversations}/${id}` : null,
  );
  const { data: messages, mutate: reloadMessages } = useApiSWR<SupportMessage[]>(
    id ? `${ENDPOINTS.supportConversations}/${id}/messages` : null,
  );
  const { data: staffList } = useApiSWR<PlatformStaff[]>(ENDPOINTS.staff);

  async function assign() {
    if (!staffId) return;
    try {
      await apiPatch(`${ENDPOINTS.supportConversations}/${id}`, {
        assignedStaffId: staffId,
        status: 'assigned',
        departmentId:
          staffList?.find((s) => s.id === staffId)?.departmentId ?? null,
      });
      await mutate();
      toast('Conversation assigned', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body) return;
    try {
      await apiPost(`${ENDPOINTS.supportConversations}/${id}/messages`, { body });
      setReply('');
      await reloadMessages();
      await mutate();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function resolve() {
    try {
      await apiPatch(`${ENDPOINTS.supportConversations}/${id}`, {
        status: 'resolved',
      });
      await mutate();
      toast('Conversation resolved', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !conv) return <DetailPageSkeleton />;
  if (error || !conv) {
    return (
      <ErrorState
        message={error?.message ?? 'Conversation not found'}
        onRetry={() => void mutate()}
      />
    );
  }

  const thread = messages ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/support"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to inbox
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          {conv.subject}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {conv.participantType === 'vendor'
            ? conv.vendorName ?? 'Vendor'
            : conv.customerName ?? 'Customer'}
          {conv.relatedBookingId ? (
            <>
              {' · '}
              <Link to={`/bookings/${conv.relatedBookingId}`} className="text-accent">
                {conv.relatedBookingId.toUpperCase()}
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <CanAccess permission="change_supportticket">
        <Card className="!p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs font-medium text-text-muted">
                Assign to staff
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="">Select staff…</option>
                {(staffList ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Button size="sm" onClick={() => void assign()} disabled={!staffId}>
              Assign
            </Button>
            <Button size="sm" variant="outline" onClick={() => void resolve()}>
              Resolve
            </Button>
          </div>
        </Card>
      </CanAccess>

      <Card className="!p-4">
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {thread.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'rounded-xl px-3 py-2 text-sm',
                msg.authorRole === 'customer' || msg.authorRole === 'vendor'
                  ? 'bg-canvas'
                  : msg.authorRole === 'system'
                    ? 'bg-warning-muted/50 text-text-muted text-center text-xs'
                    : 'bg-accent-muted/40',
              )}
            >
              <p className="text-xs font-medium text-text-muted">
                {msg.authorName} · {formatDateTime(msg.createdAt)}
              </p>
              <p className="mt-1 text-text-primary">{msg.body}</p>
            </div>
          ))}
        </div>

        <CanAccess permission="change_supportticket">
          <div className="mt-4 flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply…"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <Button size="sm" onClick={() => void sendReply()}>Send</Button>
          </div>
        </CanAccess>
      </Card>
    </div>
  );
}
