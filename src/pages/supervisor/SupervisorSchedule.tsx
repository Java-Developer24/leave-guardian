import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import Modal from '@/components/modals/Modal';
import { formatDate, toDateStr } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { ArrowLeftRight, Send } from 'lucide-react';

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeeksForMonth(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const weeks: Date[] = [];
  let cursor = startOfWeek(first);

  while (cursor <= last) {
    weeks.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

export default function SupervisorSchedule() {
  const {
    currentUser,
    users,
    schedule,
    leaves,
    repo,
    weekoffSwapRequests,
    refreshWeekoffSwapRequests,
  } = useAppStore();

  const deptId = currentUser?.departmentId ?? 'd1';
  const today = useMemo(() => new Date(), []);
  const monthPresets = useMemo(() => ([
    { id: 'current', label: 'Current Month', value: new Date(today.getFullYear(), today.getMonth(), 1) },
    { id: 'next', label: 'Next Month', value: new Date(today.getFullYear(), today.getMonth() + 1, 1) },
  ]), [today]);

  const [monthView, setMonthView] = useState<'current' | 'next'>('current');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => toDateStr(startOfWeek(today)));
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [peerGuideId, setPeerGuideId] = useState('');
  const [sourceDate, setSourceDate] = useState('');
  const [peerDate, setPeerDate] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const visibleMonth = monthPresets.find(item => item.id === monthView)?.value ?? monthPresets[0].value;
  const weekOptions = useMemo(() => getWeeksForMonth(visibleMonth), [visibleMonth]);

  useEffect(() => {
    const preferredWeek = monthView === 'current'
      ? startOfWeek(today)
      : weekOptions[0] ?? startOfWeek(visibleMonth);
    setSelectedWeekStart(toDateStr(preferredWeek));
  }, [monthView, today, visibleMonth, weekOptions]);

  const activeWeekStartDate = useMemo(() => new Date(`${selectedWeekStart}T00:00:00`), [selectedWeekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(activeWeekStartDate, index)),
    [activeWeekStartDate],
  );
  const weekEndKey = toDateStr(weekDays[6] ?? activeWeekStartDate);

  const teamAgents = useMemo(
    () => users.filter(user => user.role === 'agent' && user.departmentId === deptId),
    [users, deptId],
  );

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;

  const weekRows = useMemo(() => {
    return teamAgents.map(agent => {
      const dayRows = weekDays.map(day => {
        const date = toDateStr(day);
        return schedule.find(item => item.userId === agent.id && item.date === date) ?? null;
      });

      const weekLeaves = leaves
        .filter(leave =>
          leave.requesterId === agent.id &&
          leave.date >= selectedWeekStart &&
          leave.date <= weekEndKey &&
          !['Rejected', 'Cancelled'].includes(leave.status),
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        agent,
        dayRows,
        weekLeaves,
        weekOffDates: dayRows.filter(Boolean).filter(item => item?.weekOff).map(item => item!.date),
      };
    });
  }, [teamAgents, weekDays, schedule, leaves, selectedWeekStart, weekEndKey]);

  const selectedGuideRow = weekRows.find(row => row.agent.id === activeGuideId) ?? null;
  const peerGuideChoices = teamAgents.filter(agent => agent.id !== activeGuideId);
  const peerGuideRow = weekRows.find(row => row.agent.id === peerGuideId) ?? null;
  const deptWeekoffRequests = weekoffSwapRequests
    .filter(request => request.departmentId === deptId)
    .sort((a, b) => (b.history[0]?.at ?? '').localeCompare(a.history[0]?.at ?? ''));

  const handleSubmitSwap = async () => {
    if (!currentUser || !activeGuideId || !peerGuideId || !sourceDate || !peerDate) {
      showToast('Select both guides and both week-off dates first', 'error');
      return;
    }

    if (sourceDate === peerDate) {
      showToast('Choose different dates for the week-off swap', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await repo.createWeekoffSwapRequest({
        requesterId: currentUser.id,
        departmentId: deptId,
        sourceGuideId: activeGuideId,
        peerGuideId,
        sourceDate,
        peerDate,
        weekStart: selectedWeekStart,
        comment: comment.trim() || undefined,
      });
      await refreshWeekoffSwapRequests();
      showToast('Week-off swap request sent to admin', 'success');
      setActiveGuideId(null);
      setPeerGuideId('');
      setSourceDate('');
      setPeerDate('');
      setComment('');
    } catch {
      showToast('Failed to submit week-off swap request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Supervisor Schedule"
        title="Team Week"
        highlight="Planner"
        description="Review current and next month schedules, track weekly leave coverage, and request week-off swaps for your reporting guides."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_360px] gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {monthPresets.map(option => (
                <button
                  key={option.id}
                  onClick={() => setMonthView(option.id as 'current' | 'next')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    monthView === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background hover:bg-muted/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Active Month</div>
              <div className="text-sm font-semibold">
                {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {weekOptions.map(weekStart => {
              const label = `${formatDate(weekStart).slice(0, 6)} - ${formatDate(addDays(weekStart, 6)).slice(0, 6)}`;
              const key = toDateStr(weekStart);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedWeekStart(key)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    selectedWeekStart === key
                      ? 'bg-info/12 text-info border border-info/20'
                      : 'bg-background border border-border hover:bg-muted/30'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <ArrowLeftRight size={16} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold">Week-Off Swap Queue</div>
              <div className="text-[11px] text-muted-foreground">Supervisor requests waiting on admin approval.</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="text-muted-foreground">Pending Admin</div>
              <div className="mt-1 text-lg font-black font-heading">
                {deptWeekoffRequests.filter(request => request.status === 'PendingAdmin').length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="text-muted-foreground">Approved</div>
              <div className="mt-1 text-lg font-black font-heading">
                {deptWeekoffRequests.filter(request => request.status === 'Approved').length}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {deptWeekoffRequests.slice(0, 3).map(request => (
              <div key={request.id} className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {getUserName(request.sourceGuideId)} to {getUserName(request.peerGuideId)}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                    request.status === 'Approved'
                      ? 'bg-success/10 text-success border-success/15'
                      : request.status === 'Rejected'
                        ? 'bg-destructive/10 text-destructive border-destructive/15'
                        : 'bg-warning/10 text-warning border-warning/15'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  {formatDate(request.sourceDate)} swapped with {formatDate(request.peerDate)}
                </div>
              </div>
            ))}
            {deptWeekoffRequests.length === 0 && (
              <div className="rounded-xl border border-border bg-background/80 px-4 py-6 text-xs text-center text-muted-foreground">
                No week-off swaps yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-sm font-bold font-heading">Weekly Guide Schedule</div>
            <div className="text-[11px] text-muted-foreground">
              {formatDate(selectedWeekStart)} to {formatDate(weekEndKey)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {teamAgents.length} reporting guides
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed text-xs premium-table">
            <colgroup>
              <col className="w-[16%]" />
              {weekDays.map(day => (
                <col key={toDateStr(day)} className="w-[7.25%]" />
              ))}
              <col className="w-[20%]" />
              <col className="w-[13.25%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Guide</th>
                {weekDays.map(day => (
                  <th key={toDateStr(day)}>
                    {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </th>
                ))}
                <th>Leaves Applied</th>
                <th>Swap Week Off</th>
              </tr>
            </thead>
            <tbody>
              {weekRows.map(row => (
                <tr key={row.agent.id}>
                  <td className="font-semibold align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                        {row.agent.name.split(' ').map(name => name[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">{row.agent.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{row.weekOffDates.length} week off</div>
                      </div>
                    </div>
                  </td>
                  {row.dayRows.map((dayRow, index) => (
                    <td key={`${row.agent.id}-${weekDays[index] ? toDateStr(weekDays[index]) : index}`} className="align-top">
                      {!dayRow ? (
                        <span className="text-[10px] text-muted-foreground/50">NA</span>
                      ) : dayRow.weekOff ? (
                        <span className="inline-flex rounded-full border border-warning/15 bg-warning/10 px-2 py-1 text-[9px] font-bold text-warning">
                          WO
                        </span>
                      ) : (
                        <div className="text-[10px] leading-tight">
                          <div className="font-semibold">
                            {dayRow.shiftStart.slice(0, 2)}-{dayRow.shiftEnd.slice(0, 2)}
                          </div>
                          <div className="text-muted-foreground">WK</div>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="align-top">
                    <div className="flex flex-wrap gap-1">
                      {row.weekLeaves.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground/60">No leave</span>
                      ) : row.weekLeaves.slice(0, 2).map(leave => (
                        <span key={leave.id} className="inline-flex rounded-full border border-info/15 bg-info/10 px-2 py-1 text-[9px] font-semibold text-info">
                          {new Date(leave.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                        </span>
                      ))}
                      {row.weekLeaves.length > 2 && (
                        <span className="inline-flex rounded-full border border-border bg-muted/30 px-2 py-1 text-[9px] font-semibold text-muted-foreground">
                          +{row.weekLeaves.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="align-top">
                    <button
                      onClick={() => {
                        setActiveGuideId(row.agent.id);
                        setPeerGuideId('');
                        setSourceDate(row.weekOffDates[0] ?? '');
                        setPeerDate('');
                        setComment('');
                      }}
                      disabled={row.weekOffDates.length === 0}
                      className="inline-flex rounded-xl border border-border px-2.5 py-1.5 text-[10px] font-semibold hover:bg-muted/30 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Swap Week Off
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selectedGuideRow} onClose={() => setActiveGuideId(null)} title="Request Week-Off Swap">
        {selectedGuideRow && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Selected Guide</div>
              <div className="mt-2 text-sm font-semibold">{selectedGuideRow.agent.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Week {formatDate(selectedWeekStart)} to {formatDate(weekEndKey)}
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Swap With Guide</label>
              <select
                value={peerGuideId}
                onChange={event => {
                  setPeerGuideId(event.target.value);
                  setPeerDate('');
                }}
                className="glass-input text-sm"
              >
                <option value="">Select a guide...</option>
                {peerGuideChoices.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold">{selectedGuideRow.agent.name} Week Off</div>
                {selectedGuideRow.weekOffDates.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground text-center">
                    No week-off dates in this week.
                  </div>
                ) : selectedGuideRow.weekOffDates.map(date => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSourceDate(date)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                      sourceDate === date
                        ? 'border-primary/25 bg-primary/8 text-primary'
                        : 'border-border bg-background hover:bg-muted/30'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold">{peerGuideRow?.agent.name ?? 'Peer'} Week Off</div>
                {!peerGuideRow ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground text-center">
                    Select another guide to view available week-off days.
                  </div>
                ) : peerGuideRow.weekOffDates.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground text-center">
                    No week-off dates available for this week.
                  </div>
                ) : peerGuideRow.weekOffDates.map(date => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setPeerDate(date)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                      peerDate === date
                        ? 'border-info/25 bg-info/8 text-info'
                        : 'border-border bg-background hover:bg-muted/30'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Comment</label>
              <textarea
                value={comment}
                onChange={event => setComment(event.target.value)}
                rows={3}
                className="glass-input resize-none text-sm"
                placeholder="Add a reason for admin review..."
              />
            </div>

            <div className="rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-xs text-info">
              This request goes to admin approval first. The team dashboard updates only after admin approval.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveGuideId(null)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSubmitSwap}
                disabled={submitting || !sourceDate || !peerDate || !peerGuideId}
                className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-40"
              >
                <Send size={14} /> {submitting ? 'Sending...' : 'Send to Admin'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
