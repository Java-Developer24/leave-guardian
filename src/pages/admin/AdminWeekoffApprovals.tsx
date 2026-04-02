import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import Modal from '@/components/modals/Modal';
import { formatDate } from '@/core/utils/dates';
import {
  getWeekoffModeLabel,
  getWeekoffRequestDescription,
  getWeekoffResultSummary,
  getWeekoffScopeLabel,
} from '@/core/utils/weekoff';
import { showToast } from '@/components/toasts/ToastContainer';
import {
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Inbox,
} from 'lucide-react';

export default function AdminWeekoffApprovals() {
  const {
    currentUser,
    weekoffSwapRequests,
    repo,
    refreshWeekoffSwapRequests,
    refreshSchedule,
    users,
  } = useAppStore();

  const [reviewAction, setReviewAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;

  const pendingRequests = useMemo(
    () => weekoffSwapRequests.filter(request => request.status === 'PendingAdmin').sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    [weekoffSwapRequests],
  );
  const reviewedRequests = useMemo(
    () => weekoffSwapRequests
      .filter(request => request.status !== 'PendingAdmin')
      .sort((a, b) => (b.history[b.history.length - 1]?.at ?? '').localeCompare(a.history[a.history.length - 1]?.at ?? '')),
    [weekoffSwapRequests],
  );

  const handleReview = async () => {
    if (!reviewAction || !currentUser) return;

    try {
      if (reviewAction.action === 'approve') {
        await repo.approveWeekoffSwapRequest(reviewAction.id, currentUser.id, comment || undefined);
        showToast('Week-off swap approved', 'success');
      } else {
        await repo.rejectWeekoffSwapRequest(reviewAction.id, currentUser.id, comment || undefined);
        showToast('Week-off swap rejected', 'info');
      }
      await Promise.all([refreshWeekoffSwapRequests(), refreshSchedule()]);
      setReviewAction(null);
      setComment('');
    } catch {
      showToast('Failed to review request', 'error');
    }
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Admin Control"
        title="Week-Off Swap"
        highlight="Approvals"
        description="Review supervisor-raised week-off swap requests before they update guide schedules."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Pending Review</div>
          <div className="mt-2 text-2xl font-black font-heading">{pendingRequests.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Approved</div>
          <div className="mt-2 text-2xl font-black font-heading">{reviewedRequests.filter(request => request.status === 'Approved').length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Rejected</div>
          <div className="mt-2 text-2xl font-black font-heading">{reviewedRequests.filter(request => request.status === 'Rejected').length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_400px] gap-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-sm font-bold font-heading">Pending Week-Off Swaps</div>
            <div className="text-[11px] text-muted-foreground">Only approved requests will update the published schedule.</div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-14 text-center">
              <Inbox size={26} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No week-off swaps waiting for review.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/15">
              {pendingRequests.map(request => (
                <div key={request.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold">
                        {request.peerGuideId
                          ? `${getUserName(request.sourceGuideId)} and ${getUserName(request.peerGuideId)}`
                          : getUserName(request.sourceGuideId)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Requested by {getUserName(request.requesterId)} • {getWeekoffModeLabel(request)} • {getWeekoffScopeLabel(request)}
                      </div>
                    </div>
                    <span className="rounded-full border border-warning/15 bg-warning/10 px-3 py-1 text-[10px] font-bold text-warning">
                      Pending Admin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">{getUserName(request.sourceGuideId)}</div>
                      <div className="mt-1 font-semibold">{formatDate(request.sourceDate)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">{request.peerGuideId ? getUserName(request.peerGuideId) : 'Target Week Off'}</div>
                      <div className="mt-1 font-semibold">{formatDate(request.peerDate)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground">
                    {getWeekoffRequestDescription(request, getUserName)}
                  </div>

                  {request.comment && (
                    <div className="rounded-xl border border-info/15 bg-info/8 px-4 py-3 text-xs text-info">
                      Supervisor note: {request.comment}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setReviewAction({ id: request.id, action: 'approve' })}
                      className="px-4 py-2.5 rounded-xl border border-success/20 bg-success/10 text-success text-xs font-bold flex items-center gap-2 hover:bg-success/15 transition-colors"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      onClick={() => setReviewAction({ id: request.id, action: 'reject' })}
                      className="px-4 py-2.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-2 hover:bg-destructive/15 transition-colors"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <ArrowLeftRight size={16} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold">Recent Decisions</div>
              <div className="text-[11px] text-muted-foreground">Recently approved or rejected week-off swaps.</div>
            </div>
          </div>

          <div className="space-y-3">
            {reviewedRequests.slice(0, 6).map(request => (
              <div key={request.id} className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {request.peerGuideId
                      ? `${getUserName(request.sourceGuideId)} to ${getUserName(request.peerGuideId)}`
                      : getUserName(request.sourceGuideId)}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                    request.status === 'Approved'
                      ? 'bg-success/10 text-success border-success/15'
                      : 'bg-destructive/10 text-destructive border-destructive/15'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  {getWeekoffResultSummary(request, getUserName)}
                </div>
              </div>
            ))}
            {reviewedRequests.length === 0 && (
              <div className="rounded-xl border border-border bg-background/80 px-4 py-6 text-xs text-center text-muted-foreground">
                No reviewed requests yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={!!reviewAction}
        onClose={() => {
          setReviewAction(null);
          setComment('');
        }}
        title={reviewAction?.action === 'approve' ? 'Approve Week-Off Swap' : 'Reject Week-Off Swap'}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {reviewAction?.action === 'approve'
              ? 'Approving this request will update the affected guide schedules immediately.'
              : 'Rejecting this request will keep the current schedules unchanged.'}
          </p>
          <textarea
            value={comment}
            onChange={event => setComment(event.target.value)}
            rows={3}
            className="glass-input resize-none text-sm"
            placeholder="Optional admin note..."
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setReviewAction(null);
                setComment('');
              }}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
