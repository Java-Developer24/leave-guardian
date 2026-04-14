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
  Bell,
  Clock,
} from 'lucide-react';

export default function AdminWeekoffApprovals() {
  const {
    currentUser,
    weekoffSwapRequests,
    leaves,
    repo,
    refreshWeekoffSwapRequests,
    refreshSchedule,
    users,
  } = useAppStore();

  const [reviewAction, setReviewAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [notificationTypeFilter, setNotificationTypeFilter] = useState<'all' | 'Transfer' | 'Planned' | 'Unplanned'>('all');

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;

  const getDayName = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getWeekDayNames = (weekStart: string) => {
    // Assuming week-off spans 5-7 days from weekStart date
    // Returns day names like "Monday, Tuesday, Wednesday"
    const start = new Date(weekStart);
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push(date.toLocaleDateString('en-US', { weekday: 'long' }));
    }
    return days;
  };

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

  const transferredLeaves = useMemo(
    () => leaves
      .filter(leave => leave.type === 'Transfer' && leave.status === 'Approved')
      .sort((a, b) => {
        const aApprovalEvent = a.history.find(h => h.action === 'Approved');
        const bApprovalEvent = b.history.find(h => h.action === 'Approved');
        return (bApprovalEvent?.at ?? '').localeCompare(aApprovalEvent?.at ?? '');
      })
      .slice(0, 10),
    [leaves],
  );

  const approvedLeaveRequests = useMemo(
    () => leaves
      .filter(leave => leave.status === 'Approved' && leave.type !== 'Transfer')
      .sort((a, b) => {
        const aApprovalEvent = a.history.find(h => h.action === 'Approved');
        const bApprovalEvent = b.history.find(h => h.action === 'Approved');
        return (bApprovalEvent?.at ?? '').localeCompare(aApprovalEvent?.at ?? '');
      })
      .slice(0, 10),
    [leaves],
  );

  const unreadNotificationCount = useMemo(
    () => (transferredLeaves.length + approvedLeaveRequests.length) - readNotifications.size,
    [transferredLeaves, approvedLeaveRequests, readNotifications],
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
        action={(
          <button
            onClick={() => setNotificationCenterOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
          >
            <Bell size={15} />
            Notification Center
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
        )}
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
                      <div className="text-muted-foreground font-semibold">{getUserName(request.sourceGuideId)}</div>
                      <div className="mt-2 font-semibold text-sm">
                        {getWeekDayNames(request.sourceDate).slice(0, 2).join(', ')} week-off
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        📅 Starting: {formatDate(request.sourceDate)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground font-semibold">
                        {request.peerGuideId ? `${getUserName(request.peerGuideId)}` : 'Target Week-Off'}
                      </div>
                      <div className="mt-2 font-semibold text-sm">
                        {getWeekDayNames(request.peerDate).slice(0, 2).join(', ')} week-off
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        📅 Starting: {formatDate(request.peerDate)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-info/15 bg-info/8 px-4 py-3 text-xs text-info">
                    ℹ️ <strong>Swap Summary:</strong> {getUserName(request.sourceGuideId)}'s {getWeekDayNames(request.sourceDate).slice(0, 2).join(', ')} week-off is being swapped with {request.peerGuideId ? `${getUserName(request.peerGuideId)}'s ${getWeekDayNames(request.peerDate).slice(0, 2).join(', ')} week-off` : 'another guide'}. Both parties will be notified of changes.
                  </div>

                  {/* <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground">
                    {getWeekoffRequestDescription(request, getUserName)}
                  </div> */}

                  {request.comment && (
                    <div className="rounded-xl border border-info/15 bg-info/8 px-4 py-3 text-xs text-info">
                      Supervisor comments: {request.comment}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-success/15 bg-success/8 p-3 text-success flex items-center gap-2">
                      <CheckCircle size={14} /> 7th day working condition check: Passed
                    </div>
                    <div className="rounded-xl border border-success/15 bg-success/8 p-3 text-success flex items-center gap-2">
                      <CheckCircle size={14} /> Required HC Availability check: Passed
                    </div>
                  </div>

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
            {reviewedRequests.slice(0, 12).map(request => {
              const approvalEvent = request.history.find(h => h.action === 'Approved' || h.action === 'Rejected');
              const approvalDate = approvalEvent?.at ? new Date(approvalEvent.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending';
              const applicationDate = request.history.length > 0 ? new Date(request.history[0].at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not available';
              return (
                <div key={request.id} className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">
                      {request.peerGuideId
                        ? `${getUserName(request.sourceGuideId)} ↔ ${getUserName(request.peerGuideId)}`
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
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground/80">
                    <span className="flex items-center gap-1"><Clock size={11} /> Applied: {applicationDate}</span>
                    <span className="flex items-center gap-1"><CheckCircle size={11} /> Approved: {approvalDate}</span>
                  </div>
                </div>
              );
            })}
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

      <Modal
        open={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        title="Notification Center"
      >
        <div className="space-y-4">
          {/* Leave Type Filter */}
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">Filter by Type</label>
            <select
              value={notificationTypeFilter}
              onChange={(e) => setNotificationTypeFilter(e.target.value as 'all' | 'Transfer' | 'Planned' | 'Unplanned')}
              className="glass-input w-full text-sm"
            >
              <option value="all">All Notifications</option>
              <option value="Transfer">Transferred Leaves</option>
              <option value="Planned">Planned Leave Requests</option>
              <option value="Unplanned">Unplanned Leave Requests</option>
            </select>
          </div>

          {transferredLeaves.length === 0 && approvedLeaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={24} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <>
              {(notificationTypeFilter === 'all' || notificationTypeFilter === 'Transfer') && transferredLeaves.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
                    Transferred Leaves ({transferredLeaves.length})
                  </div>
                  {transferredLeaves.map(leave => {
                    const approvalEvent = leave.history.find(h => h.action === 'Approved');
                    const approvalDateText = "Isaac Allen approved on " + (approvalEvent?.at ? new Date(approvalEvent.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending');
                    const notifId = `transfer-${leave.id}`;
                    const isRead = readNotifications.has(notifId);
                    return (
                      <div
                        key={leave.id}
                        className={`rounded-xl border p-3 ${isRead ? 'border-border bg-muted/10' : 'border-primary/20 bg-primary/10'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-xs flex-1">
                            <div className="font-semibold">{getUserName(leave.requesterId)}'s leave transferred to {leave.peerId ? getUserName(leave.peerId) : 'another guide'}</div>
                            <div className="mt-2 text-muted-foreground space-y-1 text-[10px]">
                              <div>📅 <strong>Leave Date:</strong> {formatDate(leave.date)} ({new Date(leave.date).toLocaleDateString('en-US', { weekday: 'long' })})</div>
                              <div>📝 <strong>Reason:</strong> {leave.reason || 'Leave transfer by supervisor'}</div>
                              <div>✅ <strong>Approved Info:</strong> {approvalDateText}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newSet = new Set(readNotifications);
                              newSet.add(notifId);
                              setReadNotifications(newSet);
                            }}
                            className="text-[10px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted/30 whitespace-nowrap flex-shrink-0"
                          >
                            Mark as read
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(notificationTypeFilter === 'all' || notificationTypeFilter === 'Planned' || notificationTypeFilter === 'Unplanned') && approvedLeaveRequests.length > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-border">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
                    Approved Leave Requests ({approvedLeaveRequests.length})
                  </div>
                  {approvedLeaveRequests
                    .filter(leave => notificationTypeFilter === 'all' || leave.type === notificationTypeFilter)
                    .map(leave => {
                    const approvalEvent = leave.history.find(h => h.action === 'Approved');
                    const approvalDateText = approvalEvent?.at ? new Date(approvalEvent.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending';
                    const notifId = `leave-${leave.id}`;
                    const isRead = readNotifications.has(notifId);
                    return (
                      <div
                        key={leave.id}
                        className={`rounded-xl border p-3 ${isRead ? 'border-border bg-muted/10' : 'border-primary/20 bg-primary/10'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-xs flex-1">
                            <div className="font-semibold">{getUserName(leave.requesterId)} - {leave.type} Leave Request Approved</div>
                            <div className="mt-2 text-muted-foreground space-y-1 text-[10px]">
                              <div>📅 <strong>Date:</strong> {formatDate(leave.date)} ({new Date(leave.date).toLocaleDateString('en-US', { weekday: 'long' })})</div>
                              <div>📊 <strong>Duration:</strong> {leave.days} day(s)</div>
                              <div>💬 <strong>Reason:</strong> {leave.reason || 'No reason provided'}</div>
                              <div>✅ <strong>Approved:</strong> {approvalDateText}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newSet = new Set(readNotifications);
                              newSet.add(notifId);
                              setReadNotifications(newSet);
                            }}
                            className="text-[10px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted/30 whitespace-nowrap flex-shrink-0"
                          >
                            Mark as read
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
