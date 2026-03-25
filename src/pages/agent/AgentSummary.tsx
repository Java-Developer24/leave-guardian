import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import Modal from '@/components/modals/Modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatBufferAlert, formatDate, getApprovalCountdown } from '@/core/utils/dates';
import { useLiveNow } from '@/hooks/use-live-now';
import { showToast } from '@/components/toasts/ToastContainer';
import {
  Clock,
  XCircle,
  Filter,
  ArrowLeftRight,
  Search,
  Inbox,
  Repeat,
  Send,
  Calendar,
  Check,
} from 'lucide-react';

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function LeaveChoiceCard({
  title,
  subtitle,
  meta,
  selected,
  disabled = false,
  onClick,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl border p-3 text-left transition-all ${
        disabled
          ? 'cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground/50'
          : selected
            ? 'border-primary/40 bg-primary/8 shadow-[0_0_0_1px_hsla(354,100%,64%,0.12)]'
            : 'border-border bg-card/70 hover:border-primary/30 hover:bg-primary/5'
      }`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{subtitle}</div>
      {meta && <div className="mt-2 text-[10px] font-medium text-muted-foreground/70">{meta}</div>}
    </button>
  );
}

export default function AgentSummary() {
  const { currentUser, leaves, repo, users, departments } = useAppStore();
  const refreshLeaves = useAppStore(state => state.refreshLeaves);
  const refreshForecastAlerts = useAppStore(state => state.refreshForecastAlerts);
  const today = useMemo(() => new Date(), []);
  const liveNow = useLiveNow();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthKey = getMonthKey(currentMonthStart);
  const todayKey = today.toISOString().slice(0, 10);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [swapLeaveId, setSwapLeaveId] = useState<string | null>(null);
  const [swapPeer, setSwapPeer] = useState('');
  const [swapPeerDate, setSwapPeerDate] = useState('');
  const [swapComment, setSwapComment] = useState('');
  const [swapConfirmOpen, setSwapConfirmOpen] = useState(false);
  const [cancelLeaveId, setCancelLeaveId] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const myDept = departments.find(dept => dept.id === currentUser?.departmentId);
  const monthKey = getMonthKey(visibleMonth);
  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthButtonLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long' });

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;
  const getBufferAlert = (date: string) => formatBufferAlert(date, 72, liveNow);
  const getApprovalTimer = (submittedAt?: string) => submittedAt ? getApprovalCountdown(submittedAt, 72, liveNow) : null;

  const deptPeers = useMemo(
    () => users.filter(user => user.role === 'agent' && user.departmentId === currentUser?.departmentId && user.id !== currentUser?.id),
    [users, currentUser],
  );

  const relatedLeaves = useMemo(() => {
    return leaves.filter(leave =>
      leave.requesterId === currentUser?.id ||
      ((leave.type === 'Transfer' || leave.type === 'Swap') && leave.peerId === currentUser?.id),
    );
  }, [leaves, currentUser]);

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(new Set(
      relatedLeaves
        .map(leave => leave.date.slice(0, 7))
        .filter(key => key <= currentMonthKey),
    )).sort((a, b) => b.localeCompare(a));

    if (!uniqueMonths.includes(currentMonthKey)) uniqueMonths.unshift(currentMonthKey);

    return uniqueMonths.map(key => {
      const [year, month] = key.split('-').map(Number);
      const value = new Date(year, month - 1, 1);
      return {
        key,
        value,
        label: value.toLocaleDateString('en-US', { month: 'long' }),
      };
    });
  }, [currentMonthKey, relatedLeaves]);

  const monthLeaves = useMemo(() => {
    let result = relatedLeaves.filter(leave => leave.date.startsWith(monthKey));

    if (statusFilter !== 'all') result = result.filter(leave => leave.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(leave => leave.type === typeFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(leave =>
        (leave.reason ?? '').toLowerCase().includes(term) ||
        getUserName(leave.requesterId).toLowerCase().includes(term) ||
        getUserName(leave.peerId ?? '').toLowerCase().includes(term),
      );
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [getUserName, monthKey, relatedLeaves, searchTerm, statusFilter, typeFilter]);

  const approved = monthLeaves.filter(leave => leave.status === 'Approved').length;
  const pending = monthLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status)).length;
  const pendingSupervisorLeaves = relatedLeaves
    .filter(leave => leave.requesterId === currentUser?.id && ['PendingSupervisor', 'Submitted'].includes(leave.status))
    .sort((a, b) => (a.history[0]?.at ?? a.date).localeCompare(b.history[0]?.at ?? b.date));
  const nextActionableLeave = relatedLeaves
    .filter(leave =>
      leave.requesterId === currentUser?.id &&
      leave.date.startsWith(currentMonthKey) &&
      leave.date >= todayKey &&
      ['Approved', 'PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status),
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  const canManageLeave = (leaveDate: string, requesterId: string, status: string) => {
    return requesterId === currentUser?.id && leaveDate >= todayKey && ['PendingSupervisor', 'PendingPeer', 'Approved', 'Submitted'].includes(status);
  };

  const getTransferContext = (requesterId: string, peerId?: string) => {
    if (!peerId) return null;
    return requesterId === currentUser?.id
      ? `Transferred to ${getUserName(peerId)}`
      : `Transferred from ${getUserName(requesterId)}`;
  };

  const getSwapContext = (requesterId: string, peerId?: string) => {
    if (!peerId) return null;
    return `Swap with ${getUserName(requesterId === currentUser?.id ? peerId : requesterId)}`;
  };

  const resetSwapFlow = () => {
    setSwapLeaveId(null);
    setSwapPeer('');
    setSwapPeerDate('');
    setSwapComment('');
    setSwapConfirmOpen(false);
  };

  const openSwapModal = (leaveId: string) => {
    setSwapLeaveId(leaveId);
    setSwapPeer('');
    setSwapPeerDate('');
    setSwapComment('');
    setSwapConfirmOpen(false);
  };

  const swapSourceLeave = relatedLeaves.find(leave => leave.id === swapLeaveId && leave.requesterId === currentUser?.id) ?? null;
  const cancelLeave = relatedLeaves.find(leave => leave.id === cancelLeaveId && leave.requesterId === currentUser?.id) ?? null;
  const selectedSwapPeer = deptPeers.find(peer => peer.id === swapPeer);
  const swapSourceBufferAlert = swapSourceLeave ? getBufferAlert(swapSourceLeave.date) : null;
  const swapPeerBufferAlert = swapPeerDate ? getBufferAlert(swapPeerDate) : null;

  const swapPeerLeaves = useMemo(() => {
    if (!swapPeer || !swapSourceLeave) return [];

    const sourceMonthKey = swapSourceLeave.date.slice(0, 7);
    return leaves
      .filter(leave =>
        leave.requesterId === swapPeer &&
        leave.date.startsWith(sourceMonthKey) &&
        leave.date >= todayKey &&
        !['Swap', 'Transfer'].includes(leave.type) &&
        ['Approved', 'PendingSupervisor', 'Submitted'].includes(leave.status),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [leaves, swapPeer, swapSourceLeave, todayKey]);

  const handleSwapRequest = async () => {
    if (!swapSourceLeave || !swapPeer || !swapPeerDate || !currentUser) {
      showToast('Select a peer and a peer leave first', 'error');
      return;
    }

    await repo.createLeave({
      requesterId: currentUser.id,
      departmentId: currentUser.departmentId!,
      type: 'Swap',
      date: swapSourceLeave.date,
      peerLeaveDate: swapPeerDate,
      days: 1,
      reason: swapComment || `Swap request for ${swapSourceLeave.date}`,
      status: 'PendingPeer',
      peerId: swapPeer,
    });
    await refreshLeaves();
    resetSwapFlow();
    showToast('Swap request submitted', 'success');
  };

  const handleCancel = async () => {
    if (!cancelLeaveId) return;
    await repo.updateLeave(cancelLeaveId, { status: 'Cancelled' });
    await Promise.all([refreshLeaves(), refreshForecastAlerts()]);
    setCancelConfirmOpen(false);
    setCancelLeaveId(null);
    showToast('Leave cancelled', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Guide Summary"
        title="Leave"
        highlight="Summary"
        description={`${myDept?.name ?? 'Department'} • Viewing ${monthLabel}`}
        action={
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-2 text-sm font-semibold hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <Calendar size={14} className="text-primary" />
                  <span>{monthButtonLabel}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-2">
                <div className="mb-2 px-2 pt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">
                  Backdated Months
                </div>
                <div className="space-y-1">
                  {monthOptions.map(option => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setVisibleMonth(option.value);
                        setMonthPickerOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        option.key === monthKey
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Link to="/agent/leave" className="btn-primary-gradient text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <Send size={14} /> Apply Leave
            </Link>
          </div>
        }
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.95fr)] gap-5 mb-6">
        <motion.div variants={staggerItem} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-bold font-heading">Pending Approval Tracker</div>
              <div className="text-[11px] text-muted-foreground">Supervisor SLA countdown for your submitted leave requests.</div>
            </div>
            <Clock size={16} className="text-warning" />
          </div>

          {pendingSupervisorLeaves.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
              No supervisor approvals are pending for you right now.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSupervisorLeaves.slice(0, 3).map(leave => {
                const timer = getApprovalTimer(leave.history[0]?.at);
                const visibleTimer = timer && !timer.overdue ? timer : null;
                return (
                  <div key={leave.id} className="rounded-xl border border-border bg-background/80 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{formatDate(leave.date)}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{leave.type} leave waiting on supervisor approval</div>
                      </div>
                      <StatusChip status={leave.status} />
                    </div>
                    {visibleTimer && (
                      <div className="mt-3 inline-flex rounded-full border border-warning/15 bg-warning/10 px-3 py-1 text-[10px] font-bold text-warning">
                        {visibleTimer.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={staggerItem} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-bold font-heading">Next Actionable Leave</div>
              <div className="text-[11px] text-muted-foreground">Current-month leave you can still manage.</div>
            </div>
            <ArrowLeftRight size={16} className="text-info" />
          </div>

          {!nextActionableLeave ? (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
              No current-month leave is currently available for swap or cancellation.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                <div className="text-sm font-semibold">{formatDate(nextActionableLeave.date)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(nextActionableLeave.date).toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{nextActionableLeave.type} • {nextActionableLeave.status}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground">
                {!['Swap', 'Transfer'].includes(nextActionableLeave.type)
                  ? 'Swap and cancel actions are available for this request.'
                  : 'This request is linked to a peer flow, so direct swap actions stay limited.'}
              </div>
              {(() => {
                const nextApprovalTimer = ['PendingSupervisor', 'Submitted'].includes(nextActionableLeave.status)
                  ? getApprovalTimer(nextActionableLeave.history[0]?.at)
                  : null;
                if (!nextApprovalTimer || nextApprovalTimer.overdue) return null;

                return (
                  <div className="rounded-xl border border-warning/15 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning">
                    Approval timer: {nextApprovalTimer.text}
                  </div>
                );
              })()}
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="bg-card border border-border rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Filters Applied</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="glass-input w-auto min-w-[140px] py-2 text-xs">
          <option value="all">All Statuses</option>
          {['Approved', 'PendingSupervisor', 'PendingPeer', 'Rejected', 'Cancelled'].map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="glass-input w-auto min-w-[120px] py-2 text-xs">
          <option value="all">All Types</option>
          {['Planned', 'Unplanned', 'Swap'].map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input type="text" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search remarks or names..." className="glass-input pl-8 py-2 text-xs w-[220px]" />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground">{monthLeaves.length}</strong> records for {monthLabel}
        </span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm premium-table">
            <thead>
              <tr>{['Start Date', 'End Date', 'Leave Type', 'Duration', 'Remark', 'Status', 'Actions'].map(header => <th key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {monthLeaves.map((leave, index) => {
                const canManage = canManageLeave(leave.date, leave.requesterId, leave.status);
                const canSwap = canManage && !['Swap', 'Transfer'].includes(leave.type);
                const transferContext = leave.type === 'Transfer' ? getTransferContext(leave.requesterId, leave.peerId) : null;
                const swapContext = leave.type === 'Swap' ? getSwapContext(leave.requesterId, leave.peerId) : null;
                const approvalTimer = leave.requesterId === currentUser?.id && ['PendingSupervisor', 'Submitted'].includes(leave.status)
                  ? getApprovalTimer(leave.history[0]?.at)
                  : null;
                const visibleApprovalTimer = approvalTimer && !approvalTimer.overdue ? approvalTimer : null;

                return (
                  <motion.tr key={leave.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}>
                    <td className="font-semibold">{formatDate(leave.date)}</td>
                    <td className="font-medium">{formatDate(leave.date)}</td>
                    <td>
                      <span className="text-[10px] bg-muted px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1 w-fit border border-border">
                        {(leave.type === 'Swap' || leave.type === 'Transfer') && <ArrowLeftRight size={10} />}
                        {leave.type}
                      </span>
                    </td>
                    <td>{leave.days}d</td>
                    <td className="text-muted-foreground max-w-[220px] truncate">{leave.reason || '—'}</td>
                    <td>
                      <div className="space-y-1.5">
                        <StatusChip status={leave.status} />
                        {(transferContext || swapContext) && (
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {transferContext || swapContext}
                          </div>
                        )}
                        {visibleApprovalTimer && (
                          <div className="text-[10px] font-semibold text-warning">
                            {visibleApprovalTimer.text}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          {canSwap && (
                            <button onClick={() => openSwapModal(leave.id)} title="Swap" className="inline-flex items-center gap-1.5 rounded-lg border border-info/20 px-2.5 py-1.5 text-[11px] font-semibold text-info hover:bg-info/8 transition-colors">
                              <Repeat size={12} /> Swap
                            </button>
                          )}
                          <button onClick={() => { setCancelLeaveId(leave.id); setCancelConfirmOpen(false); }} title="Cancel" className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/15 px-2.5 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/8 transition-colors">
                            <XCircle size={12} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">No actions</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
              {monthLeaves.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center">
                  <Inbox size={24} className="mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm">No records found for {monthLabel}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {monthLeaves.map(leave => {
            const canManage = canManageLeave(leave.date, leave.requesterId, leave.status);
            const transferContext = leave.type === 'Transfer' ? getTransferContext(leave.requesterId, leave.peerId) : null;
            const swapContext = leave.type === 'Swap' ? getSwapContext(leave.requesterId, leave.peerId) : null;
            const approvalTimer = leave.requesterId === currentUser?.id && ['PendingSupervisor', 'Submitted'].includes(leave.status)
              ? getApprovalTimer(leave.history[0]?.at)
              : null;
            const visibleApprovalTimer = approvalTimer && !approvalTimer.overdue ? approvalTimer : null;

            return (
              <div key={leave.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm">{formatDate(leave.date)}</span>
                  <StatusChip status={leave.status} />
                </div>
                <div className="text-xs text-muted-foreground">{leave.type} • {leave.days}d</div>
                {(transferContext || swapContext) && (
                  <div className="text-xs text-muted-foreground">{transferContext || swapContext}</div>
                )}
                {visibleApprovalTimer && (
                  <div className="text-xs font-semibold text-warning">
                    {visibleApprovalTimer.text}
                  </div>
                )}
                {leave.reason && <div className="text-xs text-muted-foreground truncate">{leave.reason}</div>}
                {canManage ? (
                  <div className="flex items-center gap-3">
                    {!['Swap', 'Transfer'].includes(leave.type) && (
                      <button onClick={() => openSwapModal(leave.id)} className="text-xs text-info hover:underline font-semibold">Swap</button>
                    )}
                    <button onClick={() => { setCancelLeaveId(leave.id); setCancelConfirmOpen(false); }} className="text-xs text-destructive hover:underline font-semibold">Cancel</button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground/50">No actions</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!swapSourceLeave && !swapConfirmOpen} onClose={resetSwapFlow} title="Swap Request Details">
        {swapSourceLeave && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Your Leave</div>
                <div className="mt-1 font-semibold text-sm">{formatDate(swapSourceLeave.date)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Leave Status</div>
                <div className="mt-1 font-semibold text-sm">{swapSourceLeave.status}</div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Select Peer</label>
              <select value={swapPeer} onChange={event => { setSwapPeer(event.target.value); setSwapPeerDate(''); }} className="glass-input text-sm">
                <option value="">Select a team member...</option>
                {deptPeers.map(peer => <option key={peer.id} value={peer.id}>{peer.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold">Your Leave</div>
                <LeaveChoiceCard
                  title={formatDate(swapSourceLeave.date)}
                  subtitle={`${swapSourceLeave.type} • ${swapSourceLeave.status}`}
                  meta={swapSourceLeave.reason || 'No remarks added'}
                  selected
                  disabled
                />
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold">Peer Leaves</div>
                {!swapPeer ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-xs text-muted-foreground text-center">
                    Select a peer first to view available leaves.
                  </div>
                ) : swapPeerLeaves.length === 0 ? (
                  <div className="rounded-xl border border-slate-300/60 bg-slate-200/60 px-4 py-6 text-xs text-slate-700 text-center">
                    {selectedSwapPeer?.name ?? 'This peer'} has no available leaves for this month.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {swapPeerLeaves.map(leave => (
                      <LeaveChoiceCard
                        key={leave.id}
                        title={formatDate(leave.date)}
                        subtitle={`${leave.type} • ${leave.status}`}
                        meta={leave.reason || 'No remarks added'}
                        selected={swapPeerDate === leave.date}
                        onClick={() => setSwapPeerDate(leave.date)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(swapSourceBufferAlert || swapPeerBufferAlert) && (
              <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning space-y-1">
                {swapSourceBufferAlert && <div>Your leave: {swapSourceBufferAlert}</div>}
                {swapPeerBufferAlert && <div>Peer leave: {swapPeerBufferAlert}</div>}
              </div>
            )}

            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Comment</label>
              <textarea
                value={swapComment}
                onChange={event => setSwapComment(event.target.value)}
                rows={4}
                maxLength={250}
                className="glass-input resize-none text-sm"
                placeholder="Add a comment for the swap request..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={resetSwapFlow} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
                Close
              </button>
              <button
                onClick={() => {
                  if (!swapPeer || !swapPeerDate) {
                    showToast('Select a peer and peer leave first', 'error');
                    return;
                  }
                  setSwapConfirmOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold flex items-center gap-2"
              >
                <Check size={14} /> Submit Swap
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={swapConfirmOpen} onClose={() => setSwapConfirmOpen(false)} title="Confirm Swap Request">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Confirming will send the swap request to the selected peer first.
          </p>
          {swapSourceLeave && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">{formatDate(swapSourceLeave.date)} requested for swap</div>
              <div className="text-muted-foreground mt-1">
                With {selectedSwapPeer ? selectedSwapPeer.name : 'selected peer'} on {swapPeerDate ? formatDate(swapPeerDate) : 'their chosen leave'}
              </div>
            </div>
          )}
          {(swapSourceBufferAlert || swapPeerBufferAlert) && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning space-y-1">
              {swapSourceBufferAlert && <div>Your leave: {swapSourceBufferAlert}</div>}
              {swapPeerBufferAlert && <div>Peer leave: {swapPeerBufferAlert}</div>}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setSwapConfirmOpen(false)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
              Back
            </button>
            <button onClick={handleSwapRequest} className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold">
              Confirm Request
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!cancelLeave && !cancelConfirmOpen} onClose={() => { setCancelLeaveId(null); setCancelConfirmOpen(false); }} title="Cancel Leave Request">
        {cancelLeave && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              This will remove the leave from the active queue. Continue to the final confirmation?
            </p>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">{formatDate(cancelLeave.date)}</div>
              <div className="text-muted-foreground mt-1">{cancelLeave.type} • {cancelLeave.status}</div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setCancelLeaveId(null); setCancelConfirmOpen(false); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
                Keep Leave
              </button>
              <button onClick={() => setCancelConfirmOpen(true)} className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold">
                Continue
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)} title="Confirm Leave Cancellation">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            This is the final confirmation. Are you sure you want to cancel this leave request?
          </p>
          {cancelLeave && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">{formatDate(cancelLeave.date)}</div>
              <div className="text-muted-foreground mt-1">{cancelLeave.reason || 'No remarks added'}</div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setCancelConfirmOpen(false)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
              Back
            </button>
            <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold">
              Confirm Cancel
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
