import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import { getNextMonth, toDateStr, getDaysInMonth } from '@/core/utils/dates';
import { isDayBlocked, agentMonthlyCount } from '@/core/utils/shrinkage';
import { validateReason, validateDateSelection } from '@/core/utils/validation';
import { showToast } from '@/components/toasts/ToastContainer';
import { isTodayInWindowForMonth } from '@/core/utils/dates';

export default function AgentLeave() {
  const { currentUser, leaves, holidays, rules, leaveWindow, schedule, repo, refreshLeaves } = useAppStore();
  const next = getNextMonth();
  const [year, setYear] = useState(next.year);
  const [month, setMonth] = useState(next.month);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const windowOpen = leaveWindow.open && isTodayInWindowForMonth(leaveWindow);

  const holidayMap = useMemo(() => {
    const m: Record<string, string> = {};
    holidays.forEach(h => { m[h.date] = h.name; });
    return m;
  }, [holidays]);

  const blockedDates = useMemo(() => {
    const s = new Set<string>();
    const { getDaysInMonth } = require('@/core/utils/dates');
    const days: Date[] = getDaysInMonth(year, month);
    days.forEach(d => {
      const ds = toDateStr(d);
      if (isDayBlocked(ds, leaves, schedule, rules, holidays)) s.add(ds);
    });
    return s;
  }, [year, month, leaves, schedule, rules, holidays]);

  const requestedDates = useMemo(() => new Set(
    leaves.filter(l => l.requesterId === currentUser?.id && ['PendingSupervisor', 'Submitted'].includes(l.status)).map(l => l.date)
  ), [leaves, currentUser]);

  const approvedDates = useMemo(() => new Set(
    leaves.filter(l => l.requesterId === currentUser?.id && l.status === 'Approved').map(l => l.date)
  ), [leaves, currentUser]);

  const currentCount = agentMonthlyCount(currentUser?.id ?? '', month, year, leaves);
  const capRemaining = rules.agentMonthlyLeaveCap - currentCount;

  const handleSubmit = async () => {
    const errs: string[] = [];
    if (!windowOpen) errs.push('Leave window is closed (22nd-26th of month)');
    const dateErr = validateDateSelection(selectedDates);
    if (dateErr) errs.push(dateErr);
    const reasonErr = validateReason(reason);
    if (reasonErr) errs.push(reasonErr);
    if (selectedDates.length > capRemaining) errs.push(`Monthly cap exceeded. ${capRemaining} leave(s) remaining.`);

    if (errs.length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      for (const date of selectedDates) {
        await repo.createLeave({
          requesterId: currentUser!.id,
          departmentId: currentUser!.departmentId!,
          type: 'Planned',
          date,
          days: 1,
          reason,
          status: 'PendingSupervisor',
        });
      }
      await refreshLeaves();
      showToast(`${selectedDates.length} leave(s) submitted`, 'success');
      setSelectedDates([]);
      setReason('');
      setErrors([]);
    } catch {
      showToast('Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-2">Apply Leave</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {windowOpen
          ? <span className="text-success">Leave window is open (22nd–26th)</span>
          : <span className="text-destructive">Leave window is closed</span>
        }
        {' • '}{capRemaining} planned leave(s) remaining this month
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveCalendar
          month={month}
          year={year}
          holidays={holidayMap}
          blockedDates={blockedDates}
          requestedDates={requestedDates}
          approvedDates={approvedDates}
          selectedDates={selectedDates}
          onSelect={setSelectedDates}
          onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
        />

        <div className="glass-card p-5 space-y-4">
          <h2 className="text-lg font-semibold tracking-heading">Leave Details</h2>

          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Selected Dates</label>
            {selectedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Click dates on the calendar</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDates.map(d => (
                  <span key={d} className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium">{d}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">
              Reason *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
              placeholder="Enter reason for leave..."
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 space-y-1">
              {errors.map((e, i) => <p key={i} className="text-xs text-destructive">{e}</p>)}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !windowOpen}
            className="w-full btn-primary-gradient text-primary-foreground font-semibold py-2.5 rounded-md disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
