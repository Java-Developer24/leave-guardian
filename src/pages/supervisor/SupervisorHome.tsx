import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import StatusChip from '@/components/StatusChip';
import Modal from '@/components/modals/Modal';
import type { LeaveRequest } from '@/core/entities';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import {
  formatDate,
  getApprovalCountdown,
  getMonthKey,
  toDateStr,
} from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { useLiveNow } from '@/hooks/use-live-now';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  Clock,
  Gauge,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

function getHistoryEntry(leave: LeaveRequest, action: string) {
  for (let index = leave.history.length - 1; index >= 0; index -= 1) {
    const event = leave.history[index];
    if (event?.action === action) return event;
  }

  return undefined;
}

function formatMandays(days: number) {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export default function SupervisorHome() {
  const {
    leaves,
    schedule,
    rules,
    currentUser,
    users,
    repo,
    departments,
    weekoffSwapRequests,
    forecastAlerts,
  } = useAppStore();
  const refreshLeaves = useAppStore(state => state.refreshLeaves);
  const liveNow = useLiveNow();
  const today = useMemo(() => new Date(), []);
  const deptId = currentUser?.departmentId ?? 'd1';
  const myDept = departments.find(department => department.id === deptId);
  const currentMonthKey = getMonthKey(today);
  const currentMonthLabel = today.toLocaleDateString('en-US', { month: 'long' });
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthKey = getMonthKey(nextMonthDate);
  const nextMonthLabel = nextMonthDate.toLocaleDateString('en-US', { month: 'long' });
  const standardMandays = 25;
  const standardTargetHoursPerGuide = standardMandays * 8;
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [approveReviewId, setApproveReviewId] = useState<string | null>(null);
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const deptLeaves = useMemo(() => leaves.filter(leave => leave.departmentId === deptId), [leaves, deptId]);
  const teamAgents = useMemo(
    () => users.filter(user => user.role === 'agent' && user.departmentId === deptId),
    [users, deptId],
  );
  const teamSize = teamAgents.length;
  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();

  const todayStr = toDateStr(new Date());
  const currentShrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);
  const openForecastAlerts = useMemo(
    () => forecastAlerts.filter(alert => alert.departmentId === deptId && alert.status === 'Open'),
    [forecastAlerts, deptId],
  );
  const openForecastAlertByLeaveId = useMemo(
    () => openForecastAlerts.reduce<Record<string, typeof openForecastAlerts[number]>>((acc, alert) => {
      acc[alert.leaveId] = alert;
      return acc;
    }, {}),
    [openForecastAlerts],
  );

  const pending = useMemo(
    () => deptLeaves
      .filter(leave => leave.status === 'PendingSupervisor')
      .sort((a, b) => (getHistoryEntry(b, 'Submitted')?.at ?? b.date).localeCompare(getHistoryEntry(a, 'Submitted')?.at ?? a.date)),
    [deptLeaves],
  );
  const pendingPreview = useMemo(() => pending.slice(0, 4), [pending]);
  const pendingColumns = useMemo(() => {
    return pendingPreview.reduce<[LeaveRequest[], LeaveRequest[]]>(
      (acc, leave, index) => {
        acc[index % 2].push(leave);
        return acc;
      },
      [[], []],
    );
  }, [pendingPreview]);
  const pendingTransferCount = pending.filter(leave => leave.type === 'Transfer').length;
  const pendingWeekoffSwaps = weekoffSwapRequests.filter(
    request => request.departmentId === deptId && request.status === 'PendingAdmin',
  ).length;

  const currentMonthApprovedLeaves = deptLeaves.filter(
    leave => leave.date.startsWith(currentMonthKey) && leave.status === 'Approved',
  );
  const nextMonthPendingLeaves = deptLeaves.filter(
    leave => leave.date.startsWith(nextMonthKey) && ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status),
  );
  const currentMonthLeaveDays = currentMonthApprovedLeaves.reduce((total, leave) => total + leave.days, 0);
  const currentMonthTargetHours = teamSize * standardTargetHoursPerGuide;
  const currentMonthAchievedHours = Math.max(0, currentMonthTargetHours - (currentMonthLeaveDays * 8));
  const currentMonthDeficitHours = Math.max(0, currentMonthTargetHours - currentMonthAchievedHours);

  const teamSummary = useMemo(() => {
    return teamAgents
      .map(agent => {
        const monthLeaves = deptLeaves.filter(
          leave => leave.requesterId === agent.id && leave.date.startsWith(currentMonthKey),
        );
        const activeMonthLeaves = monthLeaves.filter(leave => !['Rejected', 'Cancelled'].includes(leave.status));
        const approvedMonthLeaves = monthLeaves.filter(leave => leave.status === 'Approved');
        const planned = activeMonthLeaves.filter(leave => leave.type === 'Planned').length;
        const unplanned = activeMonthLeaves.filter(leave => leave.type === 'Unplanned').length;
        const approvedDays = approvedMonthLeaves.reduce((total, leave) => total + leave.days, 0);
        const approvedLeaveCount = approvedMonthLeaves.length;
        const pendingCount = activeMonthLeaves.filter(
          leave => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status),
        ).length;
        const targetHours = standardTargetHoursPerGuide;
        const achievedHours = Math.max(0, targetHours - (approvedDays * 8));
        const deficitHours = Math.max(0, targetHours - achievedHours);

        return {
          id: agent.id,
          name: agent.name,
          planned,
          unplanned,
          mandays: standardMandays,
          pending: pendingCount,
          achievedHours,
          targetHours,
          deficitHours,
          approvedDays,
          approvedLeaveCount,
          requestCount: activeMonthLeaves.length,
        };
      })
      .sort((a, b) => {
        if (b.deficitHours !== a.deficitHours) return b.deficitHours - a.deficitHours;
        return b.requestCount - a.requestCount;
      })
      .slice(0, 15);
  }, [teamAgents, deptLeaves, currentMonthKey, standardMandays, standardTargetHoursPerGuide]);

  const reviewLeave = pending.find(leave => leave.id === approveReviewId) ?? null;
  const confirmApproveLeave = pending.find(leave => leave.id === confirmApproveId) ?? null;

  const closeApproveFlow = () => {
    setApproveReviewId(null);
    setConfirmApproveId(null);
  };

  const handleApprove = async () => {
    if (!confirmApproveLeave || !currentUser) return;

    await repo.approveLeave(
      confirmApproveLeave.id,
      currentUser.id,
      reviewNotes[confirmApproveLeave.id]?.trim() || undefined,
    );
    await refreshLeaves();
    closeApproveFlow();
    showToast('Leave approved', 'success');
  };

  const handleReject = async (id: string) => {
    if (!currentUser) return;

    await repo.rejectLeave(id, currentUser.id, reviewNotes[id]?.trim() || undefined);
    await refreshLeaves();
    showToast('Leave rejected', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-heading font-heading">
          Welcome, <span className="text-primary">{currentUser?.name}</span>{' '}
          <span className="text-muted-foreground text-lg">(Supervisor)</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{myDept?.name ?? 'Department'}</p>
      </div>

      <motion.div
        {...staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <motion.div variants={staggerItem}>
          <KpiCard
            label="Leaves Taken"
            value={currentMonthApprovedLeaves.length}
            icon={<Clock size={18} />}
            accent="warning"
            subtitle={`Leaves taken in ${currentMonthLabel}`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard
            label="Pending Leave Requests"
            value={nextMonthPendingLeaves.length}
            icon={<TrendingUp size={18} />}
            accent="info"
            subtitle={`Pending leave requests for ${nextMonthLabel}`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard
            label="Production Hours"
            value={`${currentMonthAchievedHours} hrs`}
            icon={<Calendar size={18} />}
            accent="primary"
            subtitle={currentMonthDeficitHours > 0
              ? `Delivered from ${currentMonthTargetHours} planned hours in ${currentMonthLabel}`
              : `All planned hours covered in ${currentMonthLabel}`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard label="Team Size" value={teamSize} icon={<Users size={18} />} accent="accent" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard
            label="Shrinkage Level"
            value={`${currentShrinkage.toFixed(1)}%`}
            icon={<Gauge size={18} />}
            accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'}
            subtitle={`Cap: ${rules.maxDailyPct}%`}
          />
        </motion.div>
      </motion.div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
        <div className="mr-auto">
          <div className="text-sm font-bold font-heading">Supervisor Actions</div>
          <div className="text-[11px] text-muted-foreground">
            Transfer requests stay supervisor-only, while week-off approvals continue to route through admin review.
          </div>
        </div>
        <Link
          to="/supervisor/approvals?type=Transfer"
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted/30"
        >
          Transfer Leaves {pendingTransferCount > 0 ? `(${pendingTransferCount})` : ''}
        </Link>
        <Link
          to="/supervisor/schedule"
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted/30"
        >
          Team Schedule {pendingWeekoffSwaps > 0 ? `(${pendingWeekoffSwaps})` : ''}
        </Link>
        <Link
          to="/supervisor/approvals"
          className="rounded-xl btn-primary-gradient px-4 py-2.5 text-xs font-bold text-primary-foreground"
        >
          Review Queue
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-bold font-heading">Forecast Attention</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Guides with forecast-backed leave impact are surfaced here before approval.
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          {openForecastAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs">
              <div className="font-semibold">{getUserName(alert.requesterId)}</div>
              <div className="mt-1 text-warning/90">
                {formatDate(alert.date)} • {alert.forecastVolume} forecast volume • {alert.availableGuides}/{alert.requiredGuides} guides after approval
              </div>
            </div>
          ))}
          {openForecastAlerts.length === 0 && (
            <div className="rounded-xl border border-border bg-background/80 px-4 py-6 text-xs text-center text-muted-foreground xl:col-span-3">
              No forecast alerts are open for the current team view.
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="flex items-center gap-2 text-base font-bold font-heading">
            <Clock size={16} className="text-warning" /> Pending Leave Requests
            <span className="ml-2 text-xs font-normal text-muted-foreground">{pending.length} requests need your action</span>
          </h2>
          <Link to="/supervisor/approvals" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <CheckSquare size={28} className="mx-auto mb-3 text-success/30" />
            <p className="text-sm font-medium text-muted-foreground">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pendingColumns.map((column, columnIndex) => (
              <div key={`pending-column-${columnIndex}`} className="space-y-4">
                {column.map((leave, index) => {
                  const submittedEvent = getHistoryEntry(leave, 'Submitted') ?? leave.history[0];
                  const acceptedByPeerEvent = getHistoryEntry(leave, 'Accepted by Peer');
                  const approvalTimer = submittedEvent ? getApprovalCountdown(submittedEvent.at, 72, liveNow) : null;
                  const alert = openForecastAlertByLeaveId[leave.id];
                  const dayShrinkage = calcDailyShrinkage(leave.date, deptLeaves, schedule);
                  const potentialShrinkage = alert?.shrinkageAfter ?? dayShrinkage;

                  return (
                    <motion.div
                      key={leave.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (columnIndex * 0.08) + (index * 0.05) }}
                      className="space-y-3 rounded-xl border border-border bg-card p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(leave.requesterId)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold">{getUserName(leave.requesterId)}</div>
                              {alert ? <AlertTriangle size={13} className="text-warning" /> : null}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{formatDate(leave.date)} • {leave.type}</div>
                          </div>
                        </div>
                        <StatusChip status={leave.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                        <div className="rounded-lg border border-border bg-muted/30 p-2">
                          <span className="block text-[9px] text-muted-foreground">Date</span>
                          <span className="font-semibold">{formatDate(leave.date)}</span>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-2">
                          <span className="block text-[9px] text-muted-foreground">Type</span>
                          <span className="font-semibold">{leave.type}</span>
                        </div>
                        <div className="col-span-2 rounded-lg border border-border bg-muted/30 p-2 sm:col-span-1">
                          <span className="block text-[9px] text-muted-foreground">Approval Time Left</span>
                          <span className={`font-semibold ${approvalTimer?.overdue ? 'text-destructive' : 'text-warning'}`}>
                            {approvalTimer?.text ?? 'Not started'}
                          </span>
                        </div>
                      </div>

                      {(leave.type === 'Swap' || leave.type === 'Transfer') && (
                        <div className={`rounded-xl border p-3 ${leave.type === 'Swap' ? 'border-info/15 bg-info/6' : 'border-primary/15 bg-primary/6'}`}>
                          <div className="text-[10px] uppercase tracking-[0.16em] font-heading text-muted-foreground/80">
                            {leave.type === 'Swap' ? 'Swap Overview' : 'Transfer Overview'}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-border bg-background/80 p-2.5">
                              <div className="text-[9px] text-muted-foreground">Applied By</div>
                              <div className="mt-1 font-semibold">{getUserName(leave.requesterId)}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-background/80 p-2.5">
                              <div className="text-[9px] text-muted-foreground">{leave.type === 'Swap' ? 'Swapping With' : 'Transfer Buddy'}</div>
                              <div className="mt-1 font-semibold">{leave.peerId ? getUserName(leave.peerId) : 'Not assigned'}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-background/80 p-2.5">
                              <div className="text-[9px] text-muted-foreground">Applied On</div>
                              <div className="mt-1 font-semibold">{submittedEvent ? formatDate(submittedEvent.at) : '—'}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-background/80 p-2.5">
                              <div className="text-[9px] text-muted-foreground">Guide Accepted On</div>
                              <div className="mt-1 font-semibold">{acceptedByPeerEvent ? formatDate(acceptedByPeerEvent.at) : 'Awaiting guide acceptance'}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-background/80 p-2.5">
                              <div className="text-[9px] text-muted-foreground">Requester Leave Date</div>
                              <div className="mt-1 font-semibold">{formatDate(leave.date)}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-background/80 p-2.5">
                              <div className="text-[9px] text-muted-foreground">{leave.type === 'Swap' ? 'Peer Leave Date' : 'Coverage Status'}</div>
                              <div className="mt-1 font-semibold">
                                {leave.type === 'Swap'
                                  ? (leave.peerLeaveDate ? formatDate(leave.peerLeaveDate) : 'Not provided')
                                  : 'Supervisor initiated transfer'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
                        alert
                          ? 'border-warning/15 bg-warning/5 text-warning'
                          : potentialShrinkage > rules.maxDailyPct
                            ? 'border-destructive/15 bg-destructive/5 text-destructive'
                            : 'border-info/15 bg-info/5 text-info'
                      }`}>
                        <AlertTriangle size={13} />
                        <span>
                          Current shrinkage: <strong>{dayShrinkage.toFixed(1)}%</strong>
                        </span>
                        <span className="mx-1">•</span>
                        <span>
                          After approval: <strong>{potentialShrinkage.toFixed(1)}%</strong>
                        </span>
                      </div>

                      <textarea
                        value={reviewNotes[leave.id] || ''}
                        onChange={event => setReviewNotes(prev => ({ ...prev, [leave.id]: event.target.value }))}
                        placeholder="Review notes (optional)..."
                        rows={2}
                        className="glass-input resize-none text-xs"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setApproveReviewId(leave.id);
                            setConfirmApproveId(null);
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-success/20 bg-success/10 py-2.5 text-xs font-bold text-success transition-colors hover:bg-success/20"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(leave.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/15 bg-destructive/5 py-2.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold font-heading">
              <Users size={15} className="text-info" /> Team Leave Summary
            </h2>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Sorted by highest production deficit and leave demand for {currentMonthLabel}.
            </div>
          </div>
          <Link to="/supervisor/team" className="text-[10px] font-bold text-primary hover:underline">View full team →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table w-full text-sm">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Planned Leave</th>
                <th>Unplanned Leave</th>
                <th>Mandays</th>
                <th>Approved Leave</th>
                <th>Pending Leave</th>
                <th>Production hours</th>
              </tr>
            </thead>
            <tbody>
              {teamSummary.map((agent, index) => (
                <motion.tr key={agent.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-[9px] font-bold text-primary">
                        {agent.name.split(' ').map(name => name[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-semibold">{agent.name}</span>
                    </div>
                  </td>
                  <td>{agent.planned}</td>
                  <td>{agent.unplanned}</td>
                  <td className="font-semibold text-success">{formatMandays(agent.mandays)}</td>
                  <td>{agent.approvedLeaveCount}</td>
                  <td>{agent.pending > 0 ? <span className="font-bold text-warning">{agent.pending}</span> : '0'}</td>
                  <td>
                    <div className="min-w-[250px] space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Delivered</div>
                          <div className="mt-1 font-semibold">{agent.achievedHours} hrs</div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Planned</div>
                          <div className="mt-1 font-semibold">{agent.targetHours} hrs</div>
                        </div>
                        <div className={`rounded-lg border p-2.5 ${
                          agent.deficitHours > 0
                            ? 'border-warning/20 bg-warning/10'
                            : 'border-success/20 bg-success/10'
                        }`}>
                          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                            {agent.deficitHours > 0 ? 'Deficit' : 'On Track'}
                          </div>
                          <div className={`mt-1 font-semibold ${
                            agent.deficitHours > 0 ? 'text-warning' : 'text-success'
                          }`}>
                            {agent.deficitHours > 0 ? `${agent.deficitHours} hrs` : 'On plan'}
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Leaves</div>
                          <div className="mt-1 font-semibold">{agent.approvedLeaveCount} approved / {agent.requestCount} total</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!reviewLeave && !confirmApproveId}
        onClose={closeApproveFlow}
        title={reviewLeave?.type === 'Swap' ? 'Review Swap Approval' : reviewLeave?.type === 'Transfer' ? 'Review Transfer Approval' : 'Review Leave Approval'}
      >
        {reviewLeave && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Review this request before moving to the final confirmation.
            </p>

            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Guide</div>
                <div className="mt-1 text-sm font-semibold">{getUserName(reviewLeave.requesterId)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Leave Type</div>
                <div className="mt-1 text-sm font-semibold">{reviewLeave.type}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Leave Date</div>
                <div className="mt-1 text-sm font-semibold">{formatDate(reviewLeave.date)}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Remark</div>
                <div className="mt-1 text-sm font-semibold">{reviewLeave.reason || '—'}</div>
              </div>
            </div>

            {(reviewLeave.type === 'Swap' || reviewLeave.type === 'Transfer') && (
              <div className="space-y-3 rounded-xl border border-info/15 bg-info/6 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-info/80 font-heading">
                  {reviewLeave.type === 'Swap' ? 'Swap Overview' : 'Transfer Overview'}
                </div>
                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Applied By</div>
                    <div className="mt-1 text-sm font-semibold">{getUserName(reviewLeave.requesterId)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">{reviewLeave.type === 'Swap' ? 'Swapping With' : 'Transfer Buddy'}</div>
                    <div className="mt-1 text-sm font-semibold">{reviewLeave.peerId ? getUserName(reviewLeave.peerId) : 'Not assigned'}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Applied On</div>
                    <div className="mt-1 text-sm font-semibold">
                      {formatDate((getHistoryEntry(reviewLeave, 'Submitted') ?? reviewLeave.history[0]).at)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Guide Accepted On</div>
                    <div className="mt-1 text-sm font-semibold">
                      {(() => {
                        const acceptedByPeerEvent = getHistoryEntry(reviewLeave, 'Accepted by Peer');
                        return acceptedByPeerEvent ? formatDate(acceptedByPeerEvent.at) : 'Awaiting guide acceptance';
                      })()}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Requester Leave Date</div>
                    <div className="mt-1 text-sm font-semibold">{formatDate(reviewLeave.date)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">{reviewLeave.type === 'Swap' ? 'Peer Leave Date' : 'Transfer Routing'}</div>
                    <div className="mt-1 text-sm font-semibold">
                      {reviewLeave.type === 'Swap'
                        ? (reviewLeave.peerLeaveDate ? formatDate(reviewLeave.peerLeaveDate) : 'Not provided')
                        : 'Supervisor initiated transfer'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-background/80 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Approval Note</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {reviewNotes[reviewLeave.id]?.trim() || 'No approval note added yet.'}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={closeApproveFlow} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/30">
                Cancel
              </button>
              <button onClick={() => setConfirmApproveId(reviewLeave.id)} className="rounded-xl btn-primary-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground">
                Continue
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmApproveLeave}
        onClose={closeApproveFlow}
        title={confirmApproveLeave?.type === 'Swap' ? 'Confirm Swap Approval' : confirmApproveLeave?.type === 'Transfer' ? 'Confirm Transfer Approval' : 'Confirm Leave Approval'}
      >
        {confirmApproveLeave && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              This is the final confirmation for approving this request.
            </p>

            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">{getUserName(confirmApproveLeave.requesterId)}</div>
              <div className="mt-1 text-muted-foreground">
                {confirmApproveLeave.type === 'Swap'
                  ? `${formatDate(confirmApproveLeave.date)} swapped with ${confirmApproveLeave.peerLeaveDate ? formatDate(confirmApproveLeave.peerLeaveDate) : 'the peer leave'}`
                  : confirmApproveLeave.type === 'Transfer'
                    ? `${formatDate(confirmApproveLeave.date)} transferred with ${confirmApproveLeave.peerId ? getUserName(confirmApproveLeave.peerId) : 'the assigned buddy'}`
                    : `${confirmApproveLeave.type} leave on ${formatDate(confirmApproveLeave.date)}`}
              </div>
            </div>

            <div className="rounded-xl border border-warning/15 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning">
              Approving will update the leave request history immediately.
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmApproveId(null)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/30">
                Back
              </button>
              <button onClick={handleApprove} className="rounded-xl btn-primary-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground">
                Confirm Approval
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
