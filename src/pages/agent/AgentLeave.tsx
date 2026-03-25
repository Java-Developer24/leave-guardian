import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import Modal from '@/components/modals/Modal';
import { getDaysInMonth, toDateStr, isTodayInWindowForMonth, formatBufferAlert, formatDate, getApprovalCountdown } from '@/core/utils/dates';
import { isDayBlocked, agentMonthlyCount } from '@/core/utils/shrinkage';
import { validateReason, validateDateSelection } from '@/core/utils/validation';
import { showToast } from '@/components/toasts/ToastContainer';
import type { LeaveSubmissionPreview } from '@/core/entities';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Send,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Info,
  ArrowLeftRight,
  ShieldCheck,
  Users,
  Clock,
  TrendingUp,
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

export default function AgentLeave() {
  const {
    currentUser,
    leaves,
    holidays,
    rules,
    leaveWindow,
    schedule,
    repo,
    refreshLeaves,
    refreshForecastAlerts,
    users,
  } = useAppStore();

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'swap' ? 'swap' : 'apply';
  const prefetchedSwapDate = searchParams.get('date') ?? '';
  const today = new Date();
  const [activeTab, setActiveTab] = useState<'apply' | 'swap'>(initialTab);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submissionPreview, setSubmissionPreview] = useState<LeaveSubmissionPreview[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [swapPeer, setSwapPeer] = useState('');
  const [swapMyDate, setSwapMyDate] = useState(prefetchedSwapDate);
  const [swapPeerDate, setSwapPeerDate] = useState('');
  const [swapComments, setSwapComments] = useState('');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'swap' ? 'swap' : 'apply');
    if (searchParams.get('date')) {
      setSwapMyDate(searchParams.get('date') ?? '');
    }
  }, [searchParams]);

  const windowOpen = leaveWindow.open && isTodayInWindowForMonth(leaveWindow);
  const holidayMap = useMemo(() => {
    const map: Record<string, string> = {};
    holidays.forEach(holiday => {
      map[holiday.date] = holiday.name;
    });
    return map;
  }, [holidays]);

  const blockedDates = useMemo(() => {
    const blocked = new Set<string>();
    getDaysInMonth(year, month).forEach(day => {
      const dateStr = toDateStr(day);
      if (isDayBlocked(dateStr, leaves, schedule, rules, holidays)) blocked.add(dateStr);
    });
    return blocked;
  }, [year, month, leaves, schedule, rules, holidays]);

  const requestedDates = useMemo(
    () => new Set(leaves.filter(leave => leave.requesterId === currentUser?.id && ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status)).map(leave => leave.date)),
    [leaves, currentUser],
  );
  const approvedDates = useMemo(
    () => new Set(leaves.filter(leave => leave.requesterId === currentUser?.id && leave.status === 'Approved').map(leave => leave.date)),
    [leaves, currentUser],
  );

  const currentCount = agentMonthlyCount(currentUser?.id ?? '', month, year, leaves);
  const quotaUsed = Math.min(currentCount, rules.agentMonthlyLeaveCap);
  const capRemaining = Math.max(0, rules.agentMonthlyLeaveCap - quotaUsed);
  const capPct = (quotaUsed / Math.max(1, rules.agentMonthlyLeaveCap)) * 100;

  const currentMonthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthKey = getMonthKey(today);
  const visibleMonthKey = getMonthKey(new Date(year, month, 1));
  const todayKey = today.toISOString().slice(0, 10);
  const myLeaves = leaves.filter(leave => leave.requesterId === currentUser?.id);
  const leaveType = 'Planned' as const;
  const deptPeers = useMemo(
    () => users.filter(user => user.role === 'agent' && user.departmentId === currentUser?.departmentId && user.id !== currentUser?.id),
    [users, currentUser],
  );
  const visibleApprovedDates = useMemo(
    () => myLeaves.filter(leave => leave.type === 'Planned' && leave.status === 'Approved' && leave.date.startsWith(visibleMonthKey)),
    [myLeaves, visibleMonthKey],
  );
  const visiblePendingDates = useMemo(
    () => myLeaves.filter(leave => leave.type === 'Planned' && ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status) && leave.date.startsWith(visibleMonthKey)),
    [myLeaves, visibleMonthKey],
  );

  const swapEligibleMyLeaves = useMemo(() => {
    return myLeaves
      .filter(leave =>
        leave.date.startsWith(currentMonthKey) &&
        leave.date >= todayKey &&
        !['Swap', 'Transfer'].includes(leave.type) &&
        ['Approved', 'PendingSupervisor', 'Submitted'].includes(leave.status),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentMonthKey, myLeaves, todayKey]);

  const peerLeaves = useMemo(() => {
    if (!swapPeer) return [];

    return leaves
      .filter(leave =>
        leave.requesterId === swapPeer &&
        leave.date.startsWith(currentMonthKey) &&
        leave.date >= todayKey &&
        !['Swap', 'Transfer'].includes(leave.type) &&
        ['Approved', 'PendingSupervisor', 'Submitted'].includes(leave.status),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentMonthKey, leaves, swapPeer, todayKey]);

  const selectedPeer = deptPeers.find(peer => peer.id === swapPeer);
  const selectedDateAlerts = Array.from(new Set(selectedDates)).sort().flatMap(date => {
    const message = formatBufferAlert(date, 72, today);
    return message ? [{ date, message }] : [];
  });
  const pendingSupervisorLeaves = useMemo(
    () => myLeaves
      .filter(leave => ['PendingSupervisor', 'Submitted'].includes(leave.status))
      .sort((a, b) => (a.history[0]?.at ?? a.date).localeCompare(b.history[0]?.at ?? b.date)),
    [myLeaves],
  );
  const swapMyDateBufferAlert = swapMyDate ? formatBufferAlert(swapMyDate, 72, today) : null;
  const swapPeerDateBufferAlert = swapPeerDate ? formatBufferAlert(swapPeerDate, 72, today) : null;

  const resetSubmissionFlow = () => {
    setReviewModalOpen(false);
    setConfirmModalOpen(false);
    setSubmissionPreview([]);
  };

  const handleReviewSubmit = async () => {
    const errs: string[] = [];
    const uniqueDates = Array.from(new Set(selectedDates)).sort();

    if (!windowOpen) errs.push('Leave window closed (22nd–26th).');
    const dateErr = validateDateSelection(uniqueDates);
    if (dateErr) errs.push(dateErr);
    const reasonErr = validateReason(reason);
    if (reasonErr) errs.push(reasonErr);
    if (uniqueDates.length > capRemaining) errs.push(`Cap exceeded. ${capRemaining} remaining.`);
    if (uniqueDates.some(date => blockedDates.has(date))) errs.push('Blocked dates cannot be selected.');

    if (errs.length) {
      setErrors(errs);
      return;
    }

    const preview = await repo.previewLeaveSubmission({
      requesterId: currentUser!.id,
      departmentId: currentUser!.departmentId!,
      dates: uniqueDates,
    });

    setErrors([]);
    setSubmissionPreview(preview);
    setReviewModalOpen(true);
  };

  const handleSubmit = async () => {
    const uniqueDates = Array.from(new Set(selectedDates)).sort();

    setSubmitting(true);
    try {
      for (const date of uniqueDates) {
        await repo.createLeave({
          requesterId: currentUser!.id,
          departmentId: currentUser!.departmentId!,
          type: leaveType,
          date,
          days: 1,
          reason,
          status: 'PendingSupervisor',
        });
      }

      await Promise.all([refreshLeaves(), refreshForecastAlerts()]);
      showToast(`${uniqueDates.length} leave request(s) submitted`, 'success');
      setSelectedDates([]);
      setReason('');
      setErrors([]);
      resetSubmissionFlow();
    } catch {
      showToast('Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwapSubmit = async () => {
    if (!swapPeer || !swapMyDate || !swapPeerDate) {
      showToast('Please fill all swap fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await repo.createLeave({
        requesterId: currentUser!.id,
        departmentId: currentUser!.departmentId!,
        type: 'Swap',
        date: swapMyDate,
        peerLeaveDate: swapPeerDate,
        days: 1,
        reason: swapComments || 'Swap request',
        status: 'PendingPeer',
        peerId: swapPeer,
      });
      await refreshLeaves();
      showToast('Swap request submitted', 'success');
      setSwapPeer('');
      setSwapMyDate('');
      setSwapPeerDate('');
      setSwapComments('');
    } catch {
      showToast('Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Leave Application"
        title="Apply"
        highlight="Leave"
        description="Select dates, review the coverage impact, and submit the request for approval."
      />

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'apply' | 'swap')} className="w-full">
        <TabsList className="bg-muted/50 border border-border mb-6">
          <TabsTrigger value="apply" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Apply Leaves</TabsTrigger>
          <TabsTrigger value="swap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Swap Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="apply">
          <div className="bg-card border border-border rounded-xl px-5 py-3.5 mb-5 flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3">
              {windowOpen ? (
                <>
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle size={16} className="text-success" /></div>
                  <div><span className="text-xs text-success font-bold block">Window Open</span><span className="text-[10px] text-muted-foreground">22nd – 26th</span></div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle size={16} className="text-destructive" /></div>
                  <div><span className="text-xs text-destructive font-bold block">Window Closed</span><span className="text-[10px] text-muted-foreground">Planned leave opens 22nd</span></div>
                </>
              )}
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-info" />
              <div><span className="text-base font-extrabold font-heading">{capRemaining}</span><span className="text-[10px] text-muted-foreground ml-1">planned days remaining</span></div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-warning" />
              <div><span className="text-base font-extrabold font-heading">{selectedDates.length}</span><span className="text-[10px] text-muted-foreground ml-1">dates selected</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,380px)] gap-6 items-start">
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-xs font-bold mb-3 font-heading flex items-center gap-2">
                  <Calendar size={13} className="text-info" /> Select Leave Dates
                </h3>
                <LeaveCalendar
                  month={month}
                  year={year}
                  holidays={holidayMap}
                  blockedDates={blockedDates}
                  requestedDates={requestedDates}
                  approvedDates={approvedDates}
                  selectedDates={selectedDates}
                  onSelect={setSelectedDates}
                  onMonthChange={(nextYear, nextMonth) => {
                    setYear(nextYear);
                    setMonth(nextMonth);
                  }}
                  showLegend={false}
                />
                <p className="text-[10px] text-muted-foreground mt-3">
                  Blocked dates are grayed out and unavailable for selection. Reviewing before submit will also check forecast coverage for each selected date.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-bold mb-3 font-heading">Legend & Day Status</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Quota used', desc: `${quotaUsed} of ${rules.agentMonthlyLeaveCap} planned leaves used for ${currentMonthLabel}`, tone: 'border-success/20 bg-success/8 text-success' },
                    { title: 'Pending request', desc: `${visiblePendingDates.length} planned day(s) are waiting on approval in ${currentMonthLabel}`, tone: 'border-info/20 bg-info/8 text-info' },
                    { title: 'Blocked day', desc: `${blockedDates.size} day(s) in ${currentMonthLabel} are fully blocked`, tone: 'border-slate-300/60 bg-slate-200/60 text-slate-700' },
                    { title: 'Approved leave', desc: `${visibleApprovedDates.length} planned day(s) already approved in ${currentMonthLabel}`, tone: 'border-success/20 bg-success/8 text-success' },
                    { title: 'Holiday', desc: `${Object.keys(holidayMap).filter(date => date.startsWith(visibleMonthKey)).length} holiday(s) loaded for this month`, tone: 'border-accent/20 bg-accent/8 text-accent' },
                  ].map(item => (
                    <div key={item.title} className={`rounded-xl border px-3.5 py-3 ${item.tone}`}>
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[11px] mt-1 opacity-80">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold font-heading flex items-center gap-2">
                  <Info size={15} className="text-primary" /> Leave Details
                </h2>

                <div className="bg-muted/30 rounded-xl p-3.5 border border-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Monthly Leave Balance</span>
                    <span className="font-bold">{quotaUsed} / {rules.agentMonthlyLeaveCap}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, capPct)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${capPct >= 100 ? 'bg-destructive' : 'accent-bar'}`}
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">{currentMonthLabel}</div>
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/6 px-3.5 py-3">
                  <div className="text-[10px] tracking-section uppercase text-muted-foreground font-semibold">Leave Type</div>
                  <div className="mt-1 text-sm font-bold text-primary">{leaveType}</div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Selected Dates</label>
                  {selectedDates.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 py-1">Click dates on the calendar</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {[...selectedDates].sort().map(date => (
                        <span key={date} className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-bold border border-primary/15">
                          {date}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="reason" className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Reason *</label>
                  <textarea id="reason" value={reason} onChange={event => setReason(event.target.value)} rows={3} maxLength={200} className="glass-input resize-none text-sm" placeholder="Enter reason..." />
                  <div className="text-right text-[10px] text-muted-foreground/40 mt-0.5">{reason.length}/200</div>
                </div>

                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <div className="text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Pending Approval SLA</div>
                  {pendingSupervisorLeaves.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No supervisor approvals are pending yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingSupervisorLeaves.slice(0, 3).map(leave => {
                        const timer = getApprovalCountdown(leave.history[0]?.at ?? leave.date, 72, today);
                        return (
                          <div key={leave.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-3 py-2">
                            <div>
                              <div className="text-xs font-semibold">{formatDate(leave.date)}</div>
                              <div className="text-[10px] text-muted-foreground">{leave.type} • {leave.status}</div>
                            </div>
                            <span className={`text-[10px] font-bold ${timer.overdue ? 'text-destructive' : 'text-warning'}`}>
                              {timer.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {errors.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-3 space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <AlertTriangle size={11} className="text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-destructive">{error}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleReviewSubmit}
                  disabled={submitting || selectedDates.length === 0}
                  className="w-full btn-primary-gradient font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-sm"
                >
                  <ShieldCheck size={14} /> Submit Leave Request
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swap">
          <div className="max-w-5xl">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-base font-bold font-heading flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-info" /> Swap Leave Request
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Choose one of your current-month leaves and request a swap with a peer's leave.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Select Peer</label>
                  <select value={swapPeer} onChange={event => { setSwapPeer(event.target.value); setSwapPeerDate(''); }} className="glass-input text-sm">
                    <option value="">Select a team member...</option>
                    {deptPeers.map(peer => <option key={peer.id} value={peer.id}>{peer.name}</option>)}
                  </select>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Current Month</div>
                  <div className="mt-1 text-sm font-semibold">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                <div className="space-y-3">
                  <label className="block text-xs font-semibold">Your Leaves</label>
                  <div className="space-y-3">
                    {swapEligibleMyLeaves.length === 0 ? (
                      <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-xs text-muted-foreground text-center">
                        No available leaves this month.
                      </div>
                    ) : (
                      swapEligibleMyLeaves.map(leave => (
                        <LeaveChoiceCard
                          key={leave.id}
                          title={formatDate(leave.date)}
                          subtitle={`${leave.type} • ${leave.status}`}
                          meta={leave.reason || 'No remarks added'}
                          selected={swapMyDate === leave.date}
                          onClick={() => setSwapMyDate(leave.date)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold">Peer Leaves</label>
                  <div className="space-y-3">
                    {!swapPeer ? (
                      <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-xs text-muted-foreground text-center">
                        Select a peer first to view available leaves.
                      </div>
                    ) : peerLeaves.length === 0 ? (
                      <div className="rounded-xl border border-slate-300/60 bg-slate-200/60 px-4 py-6 text-xs text-slate-700 text-center">
                        {selectedPeer?.name ?? 'This peer'} has no available leaves for the current month.
                      </div>
                    ) : (
                      peerLeaves.map(leave => (
                        <LeaveChoiceCard
                          key={leave.id}
                          title={formatDate(leave.date)}
                          subtitle={`${leave.type} • ${leave.status}`}
                          meta={leave.reason || 'No remarks added'}
                          selected={swapPeerDate === leave.date}
                          onClick={() => setSwapPeerDate(leave.date)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-semibold mb-1.5">Comments</label>
                <textarea value={swapComments} onChange={event => setSwapComments(event.target.value)} rows={4} maxLength={500} className="glass-input resize-none text-sm" placeholder="Add any notes for the peer..." />
                <div className="text-right text-[10px] text-muted-foreground/40 mt-0.5">{swapComments.length}/500</div>
              </div>

              {(swapMyDateBufferAlert || swapPeerDateBufferAlert) && (
                <div className="mt-5 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning space-y-1">
                  {swapMyDateBufferAlert && <div>Your leave: {swapMyDateBufferAlert}</div>}
                  {swapPeerDateBufferAlert && <div>Peer leave: {swapPeerDateBufferAlert}</div>}
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={handleSwapSubmit} disabled={submitting || !swapPeer || !swapMyDate || !swapPeerDate} className="flex-1 btn-primary-gradient font-bold py-3 rounded-xl text-sm disabled:opacity-40">
                  {submitting ? 'Submitting...' : 'Submit Swap Request'}
                </button>
                <button onClick={() => { setSwapPeer(''); setSwapMyDate(prefetchedSwapDate); setSwapPeerDate(''); setSwapComments(''); }} className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 mt-6">
              <h3 className="text-xs font-bold mb-3 font-heading flex items-center gap-2"><Info size={13} className="text-info" /> How Swap Works</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>1. Select a peer from your department.</p>
                <p>2. Choose one of your current-month leaves.</p>
                <p>3. Choose one of the peer's current-month leaves.</p>
                <p>4. Peer will receive a notification to accept.</p>
                <p>5. Once accepted, supervisor reviews the swap request and approves it.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Modal open={reviewModalOpen} onClose={resetSubmissionFlow} title="Review Leave Request">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Request Summary</div>
            <div className="mt-2 text-sm font-semibold">{leaveType} leave for {selectedDates.length} day(s)</div>
            <div className="mt-1 text-xs text-muted-foreground">{reason}</div>
          </div>

          <div className="space-y-3">
            {submissionPreview.map(preview => (
              <div key={preview.date} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">{formatDate(preview.date)}</div>
                    <div className="text-[11px] text-muted-foreground">Forecast volume {preview.forecastVolume} • Required guides {preview.requiredGuides}</div>
                  </div>
                  {preview.needsManagerReview ? (
                    <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[10px] font-bold text-warning">Manager review</span>
                  ) : (
                    <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[10px] font-bold text-success">Coverage ok</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="rounded-lg border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Shrinkage</div>
                    <div className="mt-1 font-semibold">{preview.shrinkageBefore}% to {preview.shrinkageAfter}%</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Available guides after approval</div>
                    <div className="mt-1 font-semibold">{preview.availableGuidesAfterApproval} of {preview.scheduledGuides}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={resetSubmissionFlow} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
              Back
            </button>
            <button onClick={() => { setReviewModalOpen(false); setConfirmModalOpen(true); }} className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold">
              Continue
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Leave Request">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            This will submit the selected leave dates for supervisor approval. Dates that require manager review will also appear in the manager forecast tab.
          </p>
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div className="font-semibold">{selectedDates.length} day(s) selected</div>
            <div className="text-muted-foreground mt-1">{[...selectedDates].sort().map(date => formatDate(date)).join(', ')}</div>
          </div>
          {selectedDateAlerts.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning space-y-1">
              <div>Leaves inside the 72-hour buffer must be approved by the supervisor within 72 hours after submission.</div>
              {selectedDateAlerts.map(alert => (
                <div key={alert.date}>
                  {formatDate(alert.date)}: {alert.message}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setConfirmModalOpen(false); setReviewModalOpen(true); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
              Back
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Confirm Submit'}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
