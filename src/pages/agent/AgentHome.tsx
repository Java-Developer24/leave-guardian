import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import Modal from '@/components/modals/Modal';
import { formatBufferAlert, formatDate, getApprovalCountdown } from '@/core/utils/dates';
import { useLiveNow } from '@/hooks/use-live-now';
import { showToast } from '@/components/toasts/ToastContainer';
import {
  Calendar,
  FileText,
  ArrowLeftRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Activity,
  Sparkles,
  BarChart3,
  Zap,
  TrendingUp,
  BellRing,
  Check,
} from 'lucide-react';

function QuotaRing({ used, cap }: { used: number; cap: number }) {
  const pct = Math.min(100, (used / Math.max(cap, 1)) * 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 90 90" className="w-full h-full stat-ring">
        <circle cx="45" cy="45" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle
          cx="45"
          cy="45"
          r={r}
          fill="none"
          stroke="url(#quota-grad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <defs>
          <linearGradient id="quota-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(354, 100%, 64%)" />
            <stop offset="100%" stopColor="hsl(35, 100%, 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold font-heading">{used}</span>
        <span className="text-[9px] text-muted-foreground/50">of {cap}</span>
      </div>
    </div>
  );
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function AgentHome() {
  const {
    currentUser,
    leaves,
    users,
    rules,
    departments,
    attendance,
    repo,
    refreshLeaves,
  } = useAppStore();

  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  const myDept = departments.find(d => d.id === currentUser?.departmentId);
  const myOwnLeaves = useMemo(
    () => leaves.filter(leave => leave.requesterId === currentUser?.id),
    [leaves, currentUser],
  );

  const approved = myOwnLeaves.filter(leave => leave.status === 'Approved').length;
  const pending = myOwnLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status)).length;
  const rejected = myOwnLeaves.filter(leave => leave.status === 'Rejected').length;
  const leaveSwaps = myOwnLeaves.filter(leave => leave.type === 'Swap').length;

  const pendingRequests = myOwnLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status));
  const pendingSupervisorCount = myOwnLeaves.filter(leave => leave.status === 'PendingSupervisor').length;
  const pendingPeerCount = myOwnLeaves.filter(leave => leave.status === 'PendingPeer').length;

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;

  const pageNow = useMemo(() => new Date(), []);
  const liveNow = useLiveNow();
  const currentMonthKey = getMonthKey(pageNow);
  const currentMonthLabel = pageNow.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthShort = pageNow.toLocaleDateString('en-US', { month: 'long' });
  const getBufferAlert = (date: string) => formatBufferAlert(date, 72, liveNow);
  const getApprovalTimer = (submittedAt?: string) => submittedAt ? getApprovalCountdown(submittedAt, 72, liveNow) : null;

  const monthlyUsed = myOwnLeaves.filter(leave =>
    ['Approved', 'PendingSupervisor', 'Submitted'].includes(leave.status) &&
    leave.date.startsWith(currentMonthKey),
  ).length;

  const monthlyBreakdown = useMemo(() => {
    return Array.from({ length: 3 }, (_, index) => {
      const d = new Date(pageNow.getFullYear(), pageNow.getMonth() - (2 - index), 1);
      const monthKey = getMonthKey(d);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      const monthLeaves = myOwnLeaves.filter(leave => leave.date.startsWith(monthKey));

      return {
        month: monthLabel,
        total: monthLeaves.length,
        approved: monthLeaves.filter(leave => leave.status === 'Approved').length,
      };
    });
  }, [myOwnLeaves, pageNow]);

  const incomingSwapActions = useMemo(
    () => leaves
      .filter(leave => leave.type === 'Swap' && leave.peerId === currentUser?.id && leave.status === 'PendingPeer')
      .sort((a, b) => (b.history[0]?.at ?? b.date).localeCompare(a.history[0]?.at ?? a.date)),
    [leaves, currentUser],
  );

  const selectedAction = incomingSwapActions.find(leave => leave.id === selectedActionId) ?? null;
  const isSameDayIncomingSwap = Boolean(selectedAction && selectedAction.peerLeaveDate && selectedAction.date === selectedAction.peerLeaveDate);
  const quickActionClass = 'w-full rounded-xl border border-border/40 bg-card/80 px-4 py-3 text-foreground font-semibold flex items-center gap-2.5 text-xs justify-center transition-all hover:bg-primary/8 hover:border-primary/35 hover:text-primary';

  const recentActivity = useMemo(() => {
    const leaveEvents = myOwnLeaves
      .filter(leave => ['Approved', 'Rejected', 'Cancelled'].includes(leave.status))
      .map(leave => ({
        id: leave.id,
        date: leave.date,
        title: `${leave.type} leave`,
        detail: leave.reason || 'No reason added',
        kind: 'leave' as const,
        status: leave.status,
      }));

    const unplannedEvents = attendance
      .filter(row => row.userId === currentUser?.id && !row.present && row.leaveType === 'Unplanned')
      .map((row, index) => ({
        id: `attendance-${row.userId}-${row.date}-${index}`,
        date: row.date,
        title: 'Unplanned leave',
        detail: 'Recorded from attendance data',
        kind: 'unplanned' as const,
        status: 'Recorded',
      }));

    return [...leaveEvents, ...unplannedEvents]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);
  }, [attendance, currentUser, myOwnLeaves]);

  const handleApproveIncomingSwap = async () => {
    if (!selectedAction || !currentUser) return;

    if (selectedAction.peerLeaveDate && selectedAction.date === selectedAction.peerLeaveDate) {
      showToast('Same-day swaps are not allowed', 'error');
      return;
    }

    const updatedHistory = [
      ...(selectedAction.history ?? []),
      {
        at: new Date().toISOString(),
        by: currentUser.id,
        action: 'Accepted by Peer',
        note: approvalComment.trim() || undefined,
      },
    ];

    await repo.updateLeave(selectedAction.id, {
      status: 'PendingSupervisor',
      history: updatedHistory,
    });
    await refreshLeaves();

    setConfirmApproveOpen(false);
    setSelectedActionId(null);
    setApprovalComment('');
    showToast('Swap request forwarded to supervisor', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Guide Dashboard"
        title="Welcome,"
        highlight={currentUser?.name ?? ''}
        description={`${myDept?.name ?? 'Department'} • ${myOwnLeaves.length} total requests • ${approved} approved this period`}
        action={
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-2 text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 font-heading">Current Month</div>
            <div className="text-sm font-bold">{currentMonthLabel}</div>
          </div>
        }
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-7">
        <motion.div variants={staggerItem}><KpiCard label="Total Requests" value={myOwnLeaves.length} icon={<FileText size={20} />} accent="primary" sparkline={monthlyBreakdown.map(month => month.total)} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${myOwnLeaves.length > 0 ? Math.round((approved / myOwnLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Leave Swaps" value={leaveSwaps} icon={<ArrowLeftRight size={20} />} accent="info" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-card-featured">
          <div className="px-6 py-4 border-b border-border/15 flex items-center justify-between bg-gradient-to-r from-warning/3 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/12">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-heading font-heading">Pending Requests</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{pendingRequests.length} awaiting approval</span>
                  <span className="text-[10px] text-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border/20">Supervisor: {pendingSupervisorCount}</span>
                  <span className="text-[10px] text-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border/20">Peer: {pendingPeerCount}</span>
                </div>
              </div>
            </div>
            <Link to="/agent/summary" className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1">View all <TrendingUp size={10} /></Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/6 flex items-center justify-center mx-auto mb-4 border border-success/10">
                <CheckCircle size={28} className="text-success/30" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No pending requests</p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border/10">
              {pendingRequests.slice(0, 10).map((leave, index) => {
                const approvalTimer = ['PendingSupervisor', 'Submitted'].includes(leave.status)
                  ? getApprovalTimer(leave.history[0]?.at)
                  : null;
                const visibleApprovalTimer = approvalTimer && !approvalTimer.overdue ? approvalTimer : null;

                return (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between px-6 py-3.5 table-row-hover"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/8 flex items-center justify-center border border-warning/10">
                        <Calendar size={16} className="text-warning" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{formatDate(leave.date)}</span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] bg-secondary/50 px-2 py-0.5 rounded-md font-medium border border-border/15">{leave.type}</span>
                          {leave.peerId && <span className="text-[9px] text-muted-foreground">with {getUserName(leave.peerId)}</span>}
                          {visibleApprovalTimer && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md font-semibold border bg-warning/10 text-warning border-warning/15">
                              {visibleApprovalTimer.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusChip status={leave.status} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card gradient-border p-6">
            <h2 className="text-xs font-bold tracking-heading mb-4 flex items-center gap-2 font-heading">
              <Activity size={14} className="text-primary" /> Monthly Quota ({currentMonthShort})
            </h2>
            <div className="flex items-center gap-5">
              <QuotaRing used={monthlyUsed} cap={rules.agentMonthlyLeaveCap} />
              <div className="space-y-2.5 text-xs flex-1">
                {[
                  { label: 'Used', value: monthlyUsed, color: 'text-foreground', bg: 'bg-primary/6' },
                  { label: 'Remaining', value: Math.max(0, rules.agentMonthlyLeaveCap - monthlyUsed), color: 'text-success', bg: 'bg-success/6' },
                  { label: 'Cap', value: `${rules.agentMonthlyLeaveCap}/mo`, color: 'text-muted-foreground', bg: 'bg-secondary/30' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between ${item.bg} rounded-lg px-3 py-1.5 border border-border/10`}>
                    <span className="text-muted-foreground/60 text-[10px]">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card accent-top-card p-6">
            <h2 className="text-xs font-bold tracking-heading mb-4 font-heading flex items-center gap-2">
              <Zap size={13} className="text-accent" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/agent/leave" className={quickActionClass}><Send size={14} /> Apply for Leave</Link>
              <Link to="/agent/summary" className={quickActionClass}><FileText size={14} /> View Summary</Link>
              <Link to="/agent/leave?tab=swap" className={quickActionClass}><ArrowLeftRight size={14} /> Leave Swaps</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-bold tracking-heading mb-5 font-heading flex items-center gap-2">
            <BarChart3 size={15} className="text-info" /> Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center">
              <Sparkles size={28} className="mx-auto mb-3 text-muted-foreground/15" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/20 via-accent/15 to-transparent" />
              <div className="space-y-4">
                {recentActivity.map((event, index) => (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="flex items-start gap-4 relative">
                    <div className={`w-[10px] h-[10px] rounded-full mt-2 flex-shrink-0 relative z-10 ring-3 ring-background ${event.kind === 'unplanned' ? 'bg-warning shadow-[0_0_8px_hsla(35,100%,60%,0.35)]' : event.status === 'Approved' ? 'bg-success shadow-[0_0_8px_hsla(152,69%,42%,0.4)]' : 'bg-destructive shadow-[0_0_8px_hsla(0,85%,60%,0.4)]'}`} />
                    <div className="flex-1 flex items-center justify-between gap-4 min-w-0 p-3 rounded-xl bg-card/40 border border-border/15 hover:border-border/30 transition-colors">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{formatDate(event.date)}</span>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{event.title}</span>
                          <span className="text-[10px] text-muted-foreground/70 truncate">{event.detail}</span>
                        </div>
                      </div>
                      {event.kind === 'unplanned' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border border-warning/10 bg-warning/15 text-warning">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                          Recorded
                        </span>
                      ) : (
                        <StatusChip status={event.status} />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-5 self-start">
          <h2 className="text-xs font-bold tracking-heading mb-3 font-heading flex items-center gap-2">
            <BellRing size={13} className="text-accent" /> Pending Actions
          </h2>
          {incomingSwapActions.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 text-center py-8">No swap requests waiting for you.</p>
          ) : (
            <div className="space-y-3">
              {incomingSwapActions.slice(0, 4).map(leave => {
                const bufferAlert = getBufferAlert(leave.date);

                return (
                  <div key={leave.id} className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold">{getUserName(leave.requesterId)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Requested {formatDate(leave.history[0]?.at ?? leave.date)}
                        </div>
                      </div>
                      <StatusChip status={leave.status} />
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Wants to swap {formatDate(leave.date)} with your leave on {leave.peerLeaveDate ? formatDate(leave.peerLeaveDate) : 'your selected day'}.
                    </div>
                    {bufferAlert && (
                      <div className="rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-[10px] font-semibold text-warning">
                        72hr Buffer Alert: {bufferAlert}
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedActionId(leave.id)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-semibold hover:bg-muted/30 transition-colors"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!selectedAction && !confirmApproveOpen} onClose={() => { setSelectedActionId(null); setApprovalComment(''); }} title="Swap Request Details">
        {selectedAction && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Request From</div>
                <div className="mt-1 font-semibold text-sm">{getUserName(selectedAction.requesterId)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Request Date</div>
                <div className="mt-1 font-semibold text-sm">{formatDate(selectedAction.history[0]?.at ?? selectedAction.date)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Their Leave</div>
                <div className="mt-1 font-semibold text-sm">{formatDate(selectedAction.date)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Your Leave</div>
                <div className="mt-1 font-semibold text-sm">{selectedAction.peerLeaveDate ? formatDate(selectedAction.peerLeaveDate) : 'Not provided'}</div>
              </div>
            </div>

            {getBufferAlert(selectedAction.date) && (
              <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning">
                72hr Buffer Alert: {getBufferAlert(selectedAction.date)}
              </div>
            )}

            {isSameDayIncomingSwap && (
              <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive">
                Same-day swaps cannot be approved. Ask the requester to select a different leave date.
              </div>
            )}

            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Comment</label>
              <textarea
                value={approvalComment}
                onChange={event => setApprovalComment(event.target.value)}
                rows={4}
                maxLength={250}
                className="glass-input resize-none text-sm"
                placeholder="Add a comment for the supervisor review..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setSelectedActionId(null); setApprovalComment(''); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
                Close
              </button>
              <button onClick={() => setConfirmApproveOpen(true)} disabled={isSameDayIncomingSwap} className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                <Check size={14} /> Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={confirmApproveOpen} onClose={() => setConfirmApproveOpen(false)} title="Confirm Swap Approval">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Confirming will send this swap request to the supervisor for final approval.
          </p>
          {selectedAction && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">{getUserName(selectedAction.requesterId)}</div>
              <div className="text-muted-foreground mt-1">
                {formatDate(selectedAction.date)} swapped with {selectedAction.peerLeaveDate ? formatDate(selectedAction.peerLeaveDate) : 'your leave'}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmApproveOpen(false)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
              Cancel
            </button>
            <button onClick={handleApproveIncomingSwap} disabled={isSameDayIncomingSwap} className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold disabled:opacity-40">
              Confirm Approval
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
