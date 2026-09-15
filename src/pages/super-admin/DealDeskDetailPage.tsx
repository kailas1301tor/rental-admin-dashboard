import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiPatch, apiPost } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/States';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import {
  apiFailureFieldErrors,
  clearFieldError,
  emptyFieldErrors,
  requireFields,
  scrollToFirstError,
  type FieldErrors,
} from '@/lib/form-errors';
import { cn, formatDateTime } from '@/lib/utils';
import type { DealDeskInquiry, DealDeskMessage, PlatformStaff } from '@/types';

export function DealDeskDetailPage() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [reply, setReply] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors);
  const [staffId, setStaffId] = useState('');
  const [statusDraft, setStatusDraft] = useState<DealDeskInquiry['status'] | ''>('');

  const { data: inquiry, error, isLoading, mutate } = useApiSWR<DealDeskInquiry>(
    id ? `${ENDPOINTS.dealDeskInquiries}/${id}` : null,
  );
  const { data: messages, mutate: reloadMessages } = useApiSWR<DealDeskMessage[]>(
    id ? `${ENDPOINTS.dealDeskInquiries}/${id}/messages` : null,
  );
  const { data: staffList } = useApiSWR<PlatformStaff[]>(ENDPOINTS.staff);

  useEffect(() => {
    if (inquiry) {
      setStaffId(inquiry.assignedStaffId || inquiry.assignedBrokerId || '');
      setStatusDraft(inquiry.status);
    }
  }, [inquiry]);

  async function assignStaff() {
    if (!staffId) return;
    try {
      await apiPatch(`${ENDPOINTS.dealDeskInquiries}/${id}`, {
        assignedStaffId: staffId,
        status: 'assigned',
      });
      await mutate();
      toast('Staff assigned', 'success');
    } catch (err) {
      toast(apiFailureFieldErrors(err).message, 'error');
    }
  }

  async function updateStatus() {
    if (!statusDraft) return;
    try {
      await apiPatch(`${ENDPOINTS.dealDeskInquiries}/${id}`, {
        status: statusDraft,
      });
      await mutate();
      toast('Status updated', 'success');
    } catch (err) {
      toast(apiFailureFieldErrors(err).message, 'error');
    }
  }

  async function sendReply() {
    const { fieldErrors: next, message } = requireFields(
      { body: reply },
      [{ field: 'body', label: 'Reply', message: 'Reply is required' }],
    );
    if (message) {
      setFieldErrors(next);
      toast(message, 'error');
      scrollToFirstError(next);
      return;
    }
    setFieldErrors(emptyFieldErrors());
    try {
      await apiPost(`${ENDPOINTS.dealDeskInquiries}/${id}/messages`, {
        body: reply.trim(),
      });
      setReply('');
      await reloadMessages();
      await mutate();
    } catch (err) {
      const failure = apiFailureFieldErrors(err);
      setFieldErrors(failure.fieldErrors);
      toast(failure.message, 'error');
      scrollToFirstError(failure.fieldErrors);
    }
  }

  if (isLoading && !inquiry) return <DetailPageSkeleton />;
  if (error || !inquiry) {
    return (
      <ErrorState
        message={error?.message ?? 'Ticket not found'}
        onRetry={() => void mutate()}
      />
    );
  }

  const contextLabel =
    inquiry.listingKind === 'booking'
      ? `Booking · ${inquiry.listingName}`
      : `${inquiry.listingKind ?? 'listing'} · ${inquiry.listingName}`;

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
          {contextLabel} · {inquiry.rboName}
        </p>
      </div>

      <CanAccess permission="change_dealdeskinquiry">
        <Card className="!p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs font-medium text-text-muted">Assign staff</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="">Select staff…</option>
                {(staffList ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Button size="sm" onClick={() => void assignStaff()} disabled={!staffId}>
              Assign / Reassign
            </Button>
            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-text-muted">Status</label>
              <select
                value={statusDraft}
                onChange={(e) =>
                  setStatusDraft(e.target.value as DealDeskInquiry['status'])
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void updateStatus()}>
              Update status
            </Button>
          </div>
        </Card>
      </CanAccess>

      <Card className="!p-4">
        <h2 className="text-sm font-semibold text-text-primary">Conversation</h2>
        <div className="mt-3 max-h-[50vh] space-y-3 overflow-y-auto">
          {(messages ?? []).length === 0 ? (
            <p className="text-sm text-text-muted">No messages yet.</p>
          ) : (
            (messages ?? []).map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm',
                  msg.authorRole === 'system'
                    ? 'bg-canvas text-center text-xs text-text-muted'
                    : 'bg-canvas',
                )}
              >
                <p className="text-xs text-text-muted">
                  {msg.authorName} · {msg.authorRole} · {formatDateTime(msg.createdAt)}
                </p>
                <p className="mt-1 text-text-primary">{msg.body}</p>
              </div>
            ))
          )}
        </div>
        <CanAccess permission="change_dealdeskinquiry">
          <div className="mt-3 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Input
                name="body"
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  setFieldErrors((m) => clearFieldError(m, 'body'));
                }}
                error={fieldErrors.body}
                placeholder="Reply as assigned staff…"
              />
            </div>
            <Button size="sm" className="mt-0.5 shrink-0" onClick={() => void sendReply()}>
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Only the currently assigned staff can send messages. Reassign to yourself first if needed.
          </p>
        </CanAccess>
      </Card>
    </div>
  );
}
