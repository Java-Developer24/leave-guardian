import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import { getNextMonth, toDateStr, getDaysInMonth } from '@/core/utils/dates';
import { isDayBlocked, agentMonthlyCount } from '@/core/utils/shrinkage';
import { validateReason, validateDateSelection } from '@/core/utils/validation';
import { showToast } from '@/components/toasts/ToastContainer';
import { isTodayInWindowForMonth } from '@/core/utils/dates';
import { Send, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AgentLeave() {
  const { currentUser, leaves, holidays, rules, leaveWindow, schedule, repo, refreshLeaves } = useAppStore();
  const next = getNextMonth();
  const [year, setYear] = useState(next.year);
  const [month, setMonth] = useState(next.month);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<'Planned' | 'Swap'>('Planned');
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
    const days = getDaysInMonth(year, month);
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
    if (!windowOpen) errs.push('Leave window is closed. Apply between 22nd–26th of the month.');
    const dateErr = validateDateSelection(selectedDates);
    if (dateErr) errs.push(dateErr);
    const reasonErr = validateReason(reason);
    if (reasonErr) errs.push(reasonErr);
    if (selectedDates.length > capRemaining) errs.push(`Monthly cap exceeded. Only ${capRemaining} leave(s) remaining this month.`);

    if (errs.length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      for (const date of selectedDates) {
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
      await refreshLeaves();
      showToast(`${selectedDates.length} leave(s) submitted successfully`, 'success');
      setSelectedDates([]);
      setReason('');
      setErrors([]);
    } catch {
      showToast('Failed to submit leave request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="LEAVE APPLICATION"
        title="Apply"
        highlight="Leave"
        description="Select dates from the calendar, enter a reason, and submit your leave request for supervisor approval."
      />

      {/* Status Bar */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {windowOpen ? (
            <><CheckCircle size={16} className="text-success" /><span className="text-sm text-success font-medium">Window Open (22nd – 26th)</span></>
          ) : (
            <><AlertTriangle size={16} className="text-destructive" /><span className="text-sm text-destructive font-medium">Window Closed</span></>
          )}
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <Info size={16} className="text-info" />
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">{capRemaining}</strong> planned leave(s) remaining this month
          </span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Max daily shrinkage: <strong className="text-foreground">{rules.maxDailyPct}%</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
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
        </div>

        {/* Form */}
        <div className="lg:col-span-2 glass-card accent-top-card p-6 space-y-5 h-fit">
          <h2 className="text-lg font-bold tracking-heading">Leave Details</h2>

          {/* Leave Type */}
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Leave Type</label>
            <div className="flex gap-2">
              {(['Planned', 'Swap'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setLeaveType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    leaveType === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Dates */}
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Selected Dates</label>
            {selectedDates.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">Click dates on the calendar →</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDates.map(d => (
                  <span key={d} className="bg-primary/15 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold border border-primary/20">{d}</span>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">
              Reason *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              maxLength={200}
              className="glass-input resize-none"
              placeholder="Enter reason for leave..."
            />
            <div className="text-right text-[10px] text-muted-foreground/50 mt-1">{reason.length}/200</div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive">{e}</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !windowOpen || selectedDates.length === 0}
            className="w-full btn-primary-gradient text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-sm"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <><Send size={15} /> Submit Leave Request</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
