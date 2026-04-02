import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import Modal from '@/components/modals/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LeaveRequest } from '@/core/entities';
import {
  formatDate,
  formatMonthYear,
  getApprovalCountdown,
  getMonthKey,
} from '@/core/utils/dates';
import { countScheduledGuidesForDepartment } from '@/core/utils/forecast';
import { showToast } from '@/components/toasts/ToastContainer';
import { useLiveNow } from '@/hooks/use-live-now';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Inbox,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

function getHistoryEntry(leave: LeaveRequest, action: string) {
  for (let index = leave.history.length - 1; index >= 0; index -= 1) {
    const event = leave.history[index];
    if (event?.action === action) return event;
  }

  return undefined;
}

function ShrinkageGauge({ now, after, cap }: { now: number; after: number; cap: number }) {
  const nowPct = Math.min(100, (now / (cap * 1.5)) * 100);
  const afterPct = Math.min(100, (after / (cap * 1.5)) * 100);
  const exceedsCap = after > cap;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5 text-[10px]">
        <span className="w-10 text-muted-foreground">Now</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <motion.div initial={{ width: 0 }} animate={{ width: `${nowPct}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full bg-info/50" />
        </div>
        <span className="w-10 text-right font-semibold">{now}%</span>
      </div>
      <div className="flex items-center gap-2.5 text-[10px]">
        <span className="w-10 text-muted-foreground">After</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${afterPct}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`h-full rounded-full ${exceedsCap ? 'bg-destructive/60' : 'bg-success/60'}`}
          />
        </div>
        <span className={`w-10 text-right font-bold ${exceedsCap ? 'text-destructive' : 'text-success'}`}>{after}%</span>
      </div>
    </div>
  );
}

export default function SupervisorApprovals() {
  const [searchParams] = useSearchParams();
  const {
    currentUser,
    leaves,
    users,
    schedule,
    rules,
    holidays,
    repo,
    refreshLeaves,
    forecastAlerts,
  } = useAppStore();
  const refreshForecastAlerts = useAppStore(state => state.refreshForecastAlerts);
  const liveNow = useLiveNow();
  const today = useMemo(() => new Date(), []);
  const deptId = currentUser?.departmentId ?? 'd1';
  const typeParam = searchParams.get('type');
  const initialTab = typeParam === 'Transfer'
    ? 'transfer'
    : typeParam === 'Forecast'
      ? 'forecast'
      : 'queue';
  const [activeTab, setActiveTab] = useState<'queue' | 'transfer' | 'forecast'>(initialTab);
  const [reviewAction, setReviewAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [forecastReviewed, setForecastReviewed] = useState<Record<string, boolean>>({});
  const [forecastReviewOpen, setForecastReviewOpen] = useState(false);
  const [transferMonthKey, setTransferMonthKey] = useState(getMonthKey(today));
  const [transferGuideId, setTransferGuideId] = useState('');
  const [transferBuddyId, setTransferBuddyId] = useState('');
  const [transferGuideLeaveId, setTransferGuideLeaveId] = useState('');
  const [transferBuddyLeaveId, setTransferBuddyLeaveId] = useState('');
  const [transferComment, setTransferComment] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const pending = useMemo(
    () => leaves
      .filter(leave => leave.departmentId === deptId && leave.status === 'PendingSupervisor')
      .sort((a, b) => (getHistoryEntry(b, 'Submitted')?.at ?? b.date).localeCompare(getHistoryEntry(a, 'Submitted')?.at ?? a.date)),
    [leaves, deptId],
  );
  const pendingTransfers = useMemo(
    () => pending.filter(leave => leave.type === 'Transfer'),
    [pending],
  );
  const deptLeaves = useMemo(
    () => leaves.filter(leave => leave.departmentId === deptId),
    [leaves, deptId],
  );
  const openForecastAlerts = useMemo(
    () => forecastAlerts.filter(alert => alert.departmentId === deptId && alert.status === 'Open').sort((a, b) => a.date.localeCompare(b.date)),
    [forecastAlerts, deptId],
  );
  const alertByLeaveId = useMemo(
    () => openForecastAlerts.reduce<Record<string, typeof openForecastAlerts[number]>>((acc, alert) => {
      acc[alert.leaveId] = alert;
      return acc;
    }, {}),
    [openForecastAlerts],
  );

  const reviewLeave = pending.find(leave => leave.id === reviewAction?.id) ?? null;
  const reviewAlert = reviewLeave ? alertByLeaveId[reviewLeave.id] : undefined;
  const requiresForecastReview = reviewAction?.action === 'approve' && !!reviewAlert;
  const hasReviewedForecast = reviewLeave ? Boolean(forecastReviewed[reviewLeave.id]) : false;
  const noteRequired = reviewAction?.action === 'approve' && requiresForecastReview;
  const approveDisabled = reviewAction?.action === 'approve'
    && (
      (requiresForecastReview && !hasReviewedForecast)
      || (noteRequired && !comment.trim())
    );

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();
  const transferMonthOptions = useMemo(() => ([
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(today.getFullYear(), today.getMonth() + 1, 1),
  ]).map(date => ({
    key: getMonthKey(date),
    label: formatMonthYear(date),
  })), [today]);
  const transferGuideOptions = useMemo(
    () => users
      .filter(user => user.role === 'agent' && user.departmentId === deptId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [users, deptId],
  );
  const transferBuddyOptions = useMemo(
    () => transferGuideOptions.filter(user => user.id !== transferGuideId),
    [transferGuideOptions, transferGuideId],
  );

  const getShrinkageChange = (leave: typeof pending[number]) => {
    const scheduledGuides = countScheduledGuidesForDepartment(leave.date, deptId, schedule, users);
    const departmentActiveLeaves = deptLeaves.filter(
      item =>
        item.date === leave.date &&
        ['Approved', 'PendingSupervisor', 'PendingPeer', 'Submitted'].includes(item.status),
    ).reduce((total, item) => total + item.days, 0);
    const now = scheduledGuides === 0 ? 0 : (departmentActiveLeaves / scheduledGuides) * 100;
    const after = alertByLeaveId[leave.id]?.shrinkageAfter ?? now;
    const holiday = holidays.find(item => item.date === leave.date);
    const cap = holiday?.allowedShrinkagePct ?? rules.maxDailyPct;
    return { now: parseFloat(now.toFixed(1)), after: parseFloat(after.toFixed(1)), exceedsCap: after > cap, cap };
  };

  const getApprovalTimer = (leave: typeof pending[number]) => {
    const submittedAt = (getHistoryEntry(leave, 'Submitted') ?? leave.history[0])?.at;
    return submittedAt ? getApprovalCountdown(submittedAt, 72, liveNow) : null;
  };

  const getTransferAvailability = (userId: string, monthKey: string) => {
    return leaves
      .filter(leave =>
        leave.requesterId === userId &&
        leave.date.startsWith(monthKey) &&
        !['Rejected', 'Cancelled'].includes(leave.status) &&
        !['Swap', 'Transfer'].includes(leave.type),
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  };

  const getTransferGuideSnapshot = (userId: string, monthKey: string) => {
    const monthLeaves = leaves
      .filter(leave =>
        leave.requesterId === userId &&
        leave.date.startsWith(monthKey) &&
        !['Rejected', 'Cancelled'].includes(leave.status),
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      approved: monthLeaves.filter(leave => leave.status === 'Approved').length,
      pending: monthLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status)).length,
      planned: monthLeaves.filter(leave => leave.type === 'Planned').length,
      unplanned: monthLeaves.filter(leave => leave.type === 'Unplanned').length,
      activeDates: monthLeaves.length,
      nextLeaveDate: monthLeaves[0]?.date,
    };
  };

  const transferGuideAvailability = useMemo(
    () => transferGuideId ? getTransferAvailability(transferGuideId, transferMonthKey) : [],
    [transferGuideId, transferMonthKey, leaves],
  );
  const transferBuddyAvailability = useMemo(
    () => transferBuddyId ? getTransferAvailability(transferBuddyId, transferMonthKey) : [],
    [transferBuddyId, transferMonthKey, leaves],
  );
  const selectedTransferGuideLeave = transferGuideAvailability.find(leave => leave.id === transferGuideLeaveId);
  const selectedTransferBuddyLeave = transferBuddyAvailability.find(leave => leave.id === transferBuddyLeaveId);
  const transferGuideSnapshot = useMemo(
    () => transferGuideId ? getTransferGuideSnapshot(transferGuideId, transferMonthKey) : null,
    [transferGuideId, transferMonthKey, leaves],
  );
  const transferBuddySnapshot = useMemo(
    () => transferBuddyId ? getTransferGuideSnapshot(transferBuddyId, transferMonthKey) : null,
    [transferBuddyId, transferMonthKey, leaves],
  );

  const resetTransferForm = () => {
    setTransferGuideId('');
    setTransferBuddyId('');
    setTransferGuideLeaveId('');
    setTransferBuddyLeaveId('');
    setTransferComment('');
  };

  const closeReviewModal = () => {
    setReviewAction(null);
    setComment('');
    setForecastReviewOpen(false);
  };

  const handleAction = async () => {
    if (!reviewAction || !reviewLeave) return;

    if (reviewAction.action === 'approve' && requiresForecastReview && !hasReviewedForecast) {
      showToast('Complete forecast review before approving', 'error');
      return;
    }

    if (reviewAction.action === 'approve') {
      await repo.approveLeave(reviewAction.id, currentUser!.id, comment.trim() || undefined);
      showToast('Leave approved', 'success');
    } else {
      await repo.rejectLeave(reviewAction.id, currentUser!.id, comment.trim() || undefined);
      showToast('Leave rejected', 'info');
    }

    await Promise.all([refreshLeaves(), refreshForecastAlerts()]);
    closeReviewModal();
  };

  const handleCreateTransfer = async () => {
    if (!currentUser || !transferGuideId || !transferBuddyId || !selectedTransferGuideLeave || !selectedTransferBuddyLeave) {
      showToast('Select both guides and their leave dates first', 'error');
      return;
    }

    if (transferGuideId === transferBuddyId) {
      showToast('Choose two different guides for the transfer', 'error');
      return;
    }

    setTransferSubmitting(true);
    try {
      const created = await repo.createLeave({
        requesterId: transferGuideId,
        departmentId: deptId,
        type: 'Transfer',
        date: selectedTransferGuideLeave.date,
        peerLeaveDate: selectedTransferBuddyLeave.date,
        days: 1,
        reason: transferComment.trim() || `Supervisor transfer request for ${selectedTransferGuideLeave.date}`,
        status: 'PendingSupervisor',
        peerId: transferBuddyId,
      });

      await repo.updateLeave(created.id, {
        history: [{
          at: created.history[0]?.at ?? new Date().toISOString(),
          by: currentUser.id,
          action: 'Submitted',
          note: transferComment.trim() || `Supervisor created a leave transfer for ${getUserName(transferGuideId)} with ${getUserName(transferBuddyId)}.`,
        }],
      });

      await refreshLeaves();
      resetTransferForm();
      setActiveTab('queue');
      showToast('Transfer request created and added to the approval queue', 'success');
    } catch {
      showToast('Failed to create the transfer request', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const queueCards = pending;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Supervisor Review"
        title="Leave"
        highlight="Approvals"
        description={`${pending.length} pending request${pending.length !== 1 ? 's' : ''}, ${pendingTransfers.length} transfer request${pendingTransfers.length !== 1 ? 's' : ''}, and ${openForecastAlerts.length} forecast alert${openForecastAlerts.length !== 1 ? 's' : ''} in view.`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-warning/12 bg-warning/10">
            <Shield size={15} className="text-warning" />
          </div>
          <div><span className="block text-lg font-black font-heading">{pending.length}</span><span className="block text-[10px] text-muted-foreground">Pending</span></div>
        </div>
        <div className="h-9 w-px bg-border/20" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/10">
            <Users size={15} className="text-primary" />
          </div>
          <div><span className="block text-lg font-black font-heading">{pendingTransfers.length}</span><span className="block text-[10px] text-muted-foreground">Transfers</span></div>
        </div>
        <div className="h-9 w-px bg-border/20" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-info/12 bg-info/10">
            <BarChart3 size={15} className="text-info" />
          </div>
          <div><span className="block text-lg font-black font-heading">{openForecastAlerts.length}</span><span className="block text-[10px] text-muted-foreground">Forecast Alerts</span></div>
        </div>
        <div className="ml-auto rounded-xl border border-border bg-muted/20 px-4 py-2 text-right">
          <div className="text-[10px] text-muted-foreground">Shrinkage cap</div>
          <div className="text-sm font-bold">{rules.maxDailyPct}%</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'queue' | 'transfer' | 'forecast')} className="w-full">
        <TabsList className="mb-6 border border-border bg-muted/50">
          <TabsTrigger value="queue" className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Approval Queue</TabsTrigger>
          <TabsTrigger value="transfer" className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Create Transfer</TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Forecast Review</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {queueCards.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-success/10 bg-success/6">
                <CheckCircle size={28} className="text-success/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All requests processed</p>
              <p className="mt-1 text-[10px] text-muted-foreground/40">Check back later for new submissions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueCards.map((leave, index) => {
                const shrinkage = getShrinkageChange(leave);
                const alert = alertByLeaveId[leave.id];
                const submittedEvent = getHistoryEntry(leave, 'Submitted') ?? leave.history[0];
                const acceptedByPeerEvent = getHistoryEntry(leave, 'Accepted by Peer');
                const timer = getApprovalTimer(leave);
                const requestMonthKey = leave.date.slice(0, 7);
                const transferAvailability = leave.type === 'Transfer'
                  ? {
                    requester: getTransferAvailability(leave.requesterId, requestMonthKey),
                    buddy: leave.peerId ? getTransferAvailability(leave.peerId, requestMonthKey) : [],
                  }
                  : null;

                return (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-accent/8 text-[10px] font-bold text-primary">
                          {getInitials(leave.requesterId)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{getUserName(leave.requesterId)}</div>
                            {alert ? <AlertTriangle size={13} className="text-warning" /> : null}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(leave.date)} • {leave.type} • submitted {submittedEvent ? formatDate(submittedEvent.at) : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {timer ? (
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                            timer.overdue
                              ? 'border-destructive/20 bg-destructive/10 text-destructive'
                              : 'border-warning/20 bg-warning/10 text-warning'
                          }`}>
                            {timer.text}
                          </span>
                        ) : null}
                        <StatusChip status={leave.status} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,320px)]">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                          <div className="rounded-xl border border-border bg-muted/20 p-3">
                            <div className="text-muted-foreground">Leave Date</div>
                            <div className="mt-1 font-semibold">{formatDate(leave.date)}</div>
                          </div>
                          <div className="rounded-xl border border-border bg-muted/20 p-3">
                            <div className="text-muted-foreground">Type</div>
                            <div className="mt-1 font-semibold">{leave.type}</div>
                          </div>
                          <div className="rounded-xl border border-border bg-muted/20 p-3">
                            <div className="text-muted-foreground">Approval Time Left</div>
                            <div className={`mt-1 font-semibold ${timer?.overdue ? 'text-destructive' : 'text-warning'}`}>
                              {timer?.text ?? 'Not started'}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border bg-muted/20 p-3">
                            <div className="text-muted-foreground">Reason</div>
                            <div className="mt-1 font-semibold">{leave.reason || '—'}</div>
                          </div>
                        </div>

                        {(leave.type === 'Swap' || leave.type === 'Transfer') && (
                          <div className={`rounded-xl border p-4 ${leave.type === 'Swap' ? 'border-info/15 bg-info/6' : 'border-primary/15 bg-primary/6'}`}>
                            <div className="text-[10px] uppercase tracking-[0.16em] font-heading text-muted-foreground/70">
                              {leave.type === 'Swap' ? 'Swap Details' : 'Transfer Details'}
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
                              <div className="rounded-xl border border-border bg-background/80 p-3">
                                <div className="text-muted-foreground">Applied By</div>
                                <div className="mt-1 font-semibold">{getUserName(leave.requesterId)}</div>
                              </div>
                              <div className="rounded-xl border border-border bg-background/80 p-3">
                                <div className="text-muted-foreground">{leave.type === 'Swap' ? 'Swapping With' : 'Transfer Buddy'}</div>
                                <div className="mt-1 font-semibold">{leave.peerId ? getUserName(leave.peerId) : 'Not assigned'}</div>
                              </div>
                              <div className="rounded-xl border border-border bg-background/80 p-3">
                                <div className="text-muted-foreground">Guide Accepted On</div>
                                <div className="mt-1 font-semibold">{acceptedByPeerEvent ? formatDate(acceptedByPeerEvent.at) : 'Awaiting guide acceptance'}</div>
                              </div>
                              <div className="rounded-xl border border-border bg-background/80 p-3">
                                <div className="text-muted-foreground">Applied On</div>
                                <div className="mt-1 font-semibold">{submittedEvent ? formatDate(submittedEvent.at) : '—'}</div>
                              </div>
                              <div className="rounded-xl border border-border bg-background/80 p-3">
                                <div className="text-muted-foreground">{leave.type === 'Swap' ? 'Requester Leave Date' : 'Transfer Date'}</div>
                                <div className="mt-1 font-semibold">{formatDate(leave.date)}</div>
                              </div>
                              <div className="rounded-xl border border-border bg-background/80 p-3">
                                <div className="text-muted-foreground">{leave.type === 'Swap' ? 'Peer Leave Date' : 'Request Source'}</div>
                                <div className="mt-1 font-semibold">
                                  {leave.type === 'Swap'
                                    ? (leave.peerLeaveDate ? formatDate(leave.peerLeaveDate) : 'Not provided')
                                    : `${getUserName(submittedEvent?.by ?? leave.requesterId)} initiated`}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {transferAvailability && (
                          <div className="rounded-xl border border-border bg-background/80 p-4">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Available Leaves In {formatMonthYear(requestMonthKey)}</div>
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                                <div className="font-semibold">{getUserName(leave.requesterId)}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {transferAvailability.requester.length > 0 ? transferAvailability.requester.map(item => (
                                    <span key={item.id} className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 font-semibold text-primary">
                                      {formatDate(item.date)}
                                    </span>
                                  )) : (
                                    <span className="text-muted-foreground">No active leave availability in this month.</span>
                                  )}
                                </div>
                              </div>
                              <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                                <div className="font-semibold">{leave.peerId ? getUserName(leave.peerId) : 'Buddy'}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {transferAvailability.buddy.length > 0 ? transferAvailability.buddy.map(item => (
                                    <span key={item.id} className="rounded-full border border-info/15 bg-info/8 px-2.5 py-1 font-semibold text-info">
                                      {formatDate(item.date)}
                                    </span>
                                  )) : (
                                    <span className="text-muted-foreground">No active leave availability in this month.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-background/80 p-4">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Shrinkage Impact</div>
                          <div className="mt-3">
                            <ShrinkageGauge now={shrinkage.now} after={shrinkage.after} cap={shrinkage.cap} />
                          </div>
                          {alert ? (
                            <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-[11px] font-semibold text-warning">
                              Forecast review required before approval.
                            </div>
                          ) : shrinkage.exceedsCap ? (
                            <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive">
                              Exceeds {shrinkage.cap}% cap after approval.
                            </div>
                          ) : (
                            <div className="mt-3 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-[11px] font-semibold text-success">
                              Coverage stays within the allowed cap.
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setReviewAction({ id: leave.id, action: 'approve' });
                              setForecastReviewed(prev => ({ ...prev, [leave.id]: false }));
                              setComment('');
                            }}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-success/20 bg-success/8 px-4 py-2.5 text-xs font-bold text-success transition-all hover:bg-success/15"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewAction({ id: leave.id, action: 'reject' });
                              setComment('');
                            }}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/15"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transfer">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="rounded-xl border border-primary/15 bg-primary/6 p-5">
              <div className="text-sm font-bold font-heading">Supervisor Leave Transfer</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Create a transfer request for two guides, review both leave inventories for the selected month, and then send the request to the approval queue.
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-border bg-muted/20">
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Month</label>
                    <select
                      value={transferMonthKey}
                      onChange={event => {
                        setTransferMonthKey(event.target.value);
                        setTransferGuideLeaveId('');
                        setTransferBuddyLeaveId('');
                      }}
                      className="glass-input text-sm"
                    >
                      {transferMonthOptions.map(option => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Guide</label>
                    <select
                      value={transferGuideId}
                      onChange={event => {
                        setTransferGuideId(event.target.value);
                        setTransferGuideLeaveId('');
                        if (event.target.value === transferBuddyId) {
                          setTransferBuddyId('');
                          setTransferBuddyLeaveId('');
                        }
                      }}
                      className="glass-input text-sm"
                    >
                      <option value="">Select a guide...</option>
                      {transferGuideOptions.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Transfer Buddy</label>
                    <select
                      value={transferBuddyId}
                      onChange={event => {
                        setTransferBuddyId(event.target.value);
                        setTransferBuddyLeaveId('');
                      }}
                      className="glass-input text-sm"
                    >
                      <option value="">Select a buddy...</option>
                      {transferBuddyOptions.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-border p-4 2xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/75 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{transferGuideId ? `${getUserName(transferGuideId)} leave inventory` : 'Select a guide first'}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Active leave dates for {formatMonthYear(transferMonthKey)}.
                      </div>
                    </div>
                    {transferGuideSnapshot ? (
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Approved <span className="font-semibold">{transferGuideSnapshot.approved}</span></span>
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Pending <span className="font-semibold">{transferGuideSnapshot.pending}</span></span>
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Planned <span className="font-semibold">{transferGuideSnapshot.planned}</span></span>
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Unplanned <span className="font-semibold">{transferGuideSnapshot.unplanned}</span></span>
                      </div>
                    ) : null}
                  </div>
                  {transferGuideSnapshot ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground">Leave Dates In Month</div>
                        <div className="mt-1 font-semibold">{transferGuideSnapshot.activeDates}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground">Next Leave Date</div>
                        <div className="mt-1 font-semibold">{transferGuideSnapshot.nextLeaveDate ? formatDate(transferGuideSnapshot.nextLeaveDate) : 'No leave planned'}</div>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    {transferGuideAvailability.length > 0 ? transferGuideAvailability.map(leave => (
                      <button
                        key={leave.id}
                        type="button"
                        onClick={() => setTransferGuideLeaveId(leave.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-xs transition-colors ${
                          transferGuideLeaveId === leave.id
                            ? 'border-primary/25 bg-primary/8 text-primary'
                            : 'border-border bg-background hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold">{formatDate(leave.date)}</div>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">{leave.status}</span>
                        </div>
                        <div className="mt-1 opacity-80">{leave.type} leave • {leave.reason || 'No reason shared'}</div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-border bg-background/80 px-4 py-6 text-center text-xs text-muted-foreground">
                        No active leave dates available for this guide in {formatMonthYear(transferMonthKey)}.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/75 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{transferBuddyId ? `${getUserName(transferBuddyId)} leave inventory` : 'Select a transfer buddy first'}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        This mirrors the paired guide view used for transfer matching.
                      </div>
                    </div>
                    {transferBuddySnapshot ? (
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Approved <span className="font-semibold">{transferBuddySnapshot.approved}</span></span>
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Pending <span className="font-semibold">{transferBuddySnapshot.pending}</span></span>
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Planned <span className="font-semibold">{transferBuddySnapshot.planned}</span></span>
                        <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">Unplanned <span className="font-semibold">{transferBuddySnapshot.unplanned}</span></span>
                      </div>
                    ) : null}
                  </div>
                  {transferBuddySnapshot ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground">Leave Dates In Month</div>
                        <div className="mt-1 font-semibold">{transferBuddySnapshot.activeDates}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground">Next Leave Date</div>
                        <div className="mt-1 font-semibold">{transferBuddySnapshot.nextLeaveDate ? formatDate(transferBuddySnapshot.nextLeaveDate) : 'No leave planned'}</div>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    {transferBuddyAvailability.length > 0 ? transferBuddyAvailability.map(leave => (
                      <button
                        key={leave.id}
                        type="button"
                        onClick={() => setTransferBuddyLeaveId(leave.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-xs transition-colors ${
                          transferBuddyLeaveId === leave.id
                            ? 'border-info/25 bg-info/8 text-info'
                            : 'border-border bg-background hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold">{formatDate(leave.date)}</div>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">{leave.status}</span>
                        </div>
                        <div className="mt-1 opacity-80">{leave.type} leave • {leave.reason || 'No reason shared'}</div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-border bg-background/80 px-4 py-6 text-center text-xs text-muted-foreground">
                        No active leave dates available for this buddy in {formatMonthYear(transferMonthKey)}.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-border p-4">
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Transfer Summary</div>
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Guide</div>
                      <div className="mt-1 font-semibold">{transferGuideId ? getUserName(transferGuideId) : 'Select a guide'}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {selectedTransferGuideLeave ? `Selected leave date ${formatDate(selectedTransferGuideLeave.date)}` : 'Pick one leave date from the guide inventory'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Transfer Buddy</div>
                      <div className="mt-1 font-semibold">{transferBuddyId ? getUserName(transferBuddyId) : 'Select a buddy'}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {selectedTransferBuddyLeave ? `Selected leave date ${formatDate(selectedTransferBuddyLeave.date)}` : 'Pick one matching leave date from the buddy inventory'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-xs text-info">
                      The transfer will be created by the supervisor and moved into the approval queue for final confirmation.
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background/75 p-4">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Supervisor Notes</label>
                  <textarea
                    value={transferComment}
                    onChange={event => setTransferComment(event.target.value)}
                    rows={4}
                    className="glass-input resize-none text-sm"
                    placeholder="Add context for the transfer request and why this pairing is needed..."
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleCreateTransfer}
                      disabled={transferSubmitting || !selectedTransferGuideLeave || !selectedTransferBuddyLeave}
                      className="w-full rounded-xl btn-primary-gradient px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto"
                    >
                      {transferSubmitting ? 'Creating...' : 'Create Transfer Request'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="forecast">
          <div className="mb-5 rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-xs text-info">
            Forecast volumes, scheduled guides, required guides, and shrinkage impact in this tab are calculated at the department level only.
          </div>
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
                  <Users size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-xl font-black font-heading">{openForecastAlerts.length}</div>
                  <div className="text-[10px] text-muted-foreground">Open forecast reviews</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-warning/15 bg-warning/10">
                  <AlertTriangle size={16} className="text-warning" />
                </div>
                <div>
                  <div className="text-xl font-black font-heading">{openForecastAlerts.filter(alert => alert.availableGuides < alert.requiredGuides).length}</div>
                  <div className="text-[10px] text-muted-foreground">Understaffed forecast days</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-info/15 bg-info/10">
                  <BarChart3 size={16} className="text-info" />
                </div>
                <div>
                  <div className="text-xl font-black font-heading">
                    {openForecastAlerts.length > 0 ? Math.max(...openForecastAlerts.map(alert => alert.forecastVolume)) : 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Peak forecast volume</div>
                </div>
              </div>
            </div>
          </div>

          {openForecastAlerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-14 text-center">
              <Inbox size={26} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No manager review items right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {openForecastAlerts.map(alert => (
                <div key={alert.id} className="space-y-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{getUserName(alert.requesterId)}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{formatDate(alert.date)} • submitted {formatDate(alert.createdAt)}</div>
                    </div>
                    <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[10px] font-bold text-warning">Needs Review</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Forecast Volume</div>
                      <div className="mt-1 font-semibold">{alert.forecastVolume}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Required Guides</div>
                      <div className="mt-1 font-semibold">{alert.requiredGuides}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Scheduled Guides</div>
                      <div className="mt-1 font-semibold">{alert.scheduledGuides}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Available After Approval</div>
                      <div className={`mt-1 font-semibold ${alert.availableGuides < alert.requiredGuides ? 'text-destructive' : 'text-success'}`}>{alert.availableGuides}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/80 p-4">
                    <div className="text-xs text-muted-foreground">Shrinkage impact</div>
                    <div className="mt-1 text-sm font-semibold">{alert.shrinkageBefore}% to {alert.shrinkageAfter}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Modal
        open={!!reviewAction && !forecastReviewOpen}
        onClose={closeReviewModal}
        title={reviewAction?.action === 'approve' ? 'Review Approval' : 'Reject Leave'}
      >
        {reviewLeave && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Guide</div>
                <div className="mt-1 text-sm font-semibold">{getUserName(reviewLeave.requesterId)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Approval Time Left</div>
                <div className={`mt-1 text-sm font-semibold ${getApprovalTimer(reviewLeave)?.overdue ? 'text-destructive' : 'text-warning'}`}>
                  {getApprovalTimer(reviewLeave)?.text ?? 'Not started'}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Leave Type</div>
                <div className="mt-1 text-sm font-semibold">{reviewLeave.type}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Date</div>
                <div className="mt-1 text-sm font-semibold">{formatDate(reviewLeave.date)}</div>
              </div>
            </div>

            {reviewAlert && reviewAction?.action === 'approve' && (
              <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs text-warning">
                <div className="font-semibold">Forecast alert is active for this guide.</div>
                <div className="mt-1">
                  The confirm button stays disabled until forecast review is completed.
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {noteRequired ? 'Approval Notes *' : 'Approval Notes'}
              </label>
              <textarea
                value={comment}
                onChange={event => setComment(event.target.value)}
                rows={4}
                className="glass-input resize-none text-sm"
                placeholder={noteRequired ? 'Add notes after completing forecast review...' : 'Optional comment...'}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={closeReviewModal} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/30">
                Cancel
              </button>
              {reviewAction?.action === 'approve' && reviewAlert ? (
                <button
                  onClick={() => setForecastReviewOpen(true)}
                  className="rounded-xl border border-warning/20 bg-warning/10 px-5 py-2.5 text-sm font-bold text-warning transition-colors hover:bg-warning/15"
                >
                  Forecast Review
                </button>
              ) : null}
              <button
                onClick={handleAction}
                disabled={approveDisabled}
                className="rounded-xl btn-primary-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {reviewAction?.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={forecastReviewOpen}
        onClose={() => setForecastReviewOpen(false)}
        title="Forecast Review"
      >
        {reviewAlert && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Forecast Volume</div>
                <div className="mt-1 text-lg font-black font-heading">{reviewAlert.forecastVolume}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Required Guides</div>
                <div className="mt-1 text-lg font-black font-heading">{reviewAlert.requiredGuides}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Scheduled Guides</div>
                <div className="mt-1 text-lg font-black font-heading">{reviewAlert.scheduledGuides}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Available After Approval</div>
                <div className={`mt-1 text-lg font-black font-heading ${reviewAlert.availableGuides < reviewAlert.requiredGuides ? 'text-destructive' : 'text-success'}`}>
                  {reviewAlert.availableGuides}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/80 p-4">
              <div className="text-xs text-muted-foreground">Shrinkage impact</div>
              <div className="mt-1 text-sm font-semibold">{reviewAlert.shrinkageBefore}% to {reviewAlert.shrinkageAfter}%</div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setForecastReviewOpen(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/30">
                Back
              </button>
              <button
                onClick={() => {
                  if (!reviewLeave) return;
                  setForecastReviewed(prev => ({ ...prev, [reviewLeave.id]: true }));
                  setForecastReviewOpen(false);
                }}
                className="rounded-xl btn-primary-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
