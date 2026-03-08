import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import { getNextMonth, toDateStr, getDaysInMonth, isTodayInWindowForMonth } from '@/core/utils/dates';
import { isDayBlocked, agentMonthlyCount } from '@/core/utils/shrinkage';
import { validateReason, validateDateSelection } from '@/core/utils/validation';
import { showToast } from '@/components/toasts/ToastContainer';
import { Send, AlertTriangle, CheckCircle, Calendar, Gauge } from 'lucide-react';

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
  const holidayMap = useMemo(() => { const m: Record<string, string> = {}; holidays.forEach(h => { m[h.date] = h.name; }); return m; }, [holidays]);
  const blockedDates = useMemo(() => { const s = new Set<string>(); getDaysInMonth(year, month).forEach(d => { const ds = toDateStr(d); if (isDayBlocked(ds, leaves, schedule, rules, holidays)) s.add(ds); }); return s; }, [year, month, leaves, schedule, rules, holidays]);
  const requestedDates = useMemo(() => new Set(leaves.filter(l => l.requesterId === currentUser?.id && ['PendingSupervisor', 'Submitted'].includes(l.status)).map(l => l.date)), [leaves, currentUser]);
  const approvedDates = useMemo(() => new Set(leaves.filter(l => l.requesterId === currentUser?.id && l.status === 'Approved').map(l => l.date)), [leaves, currentUser]);

  const currentCount = agentMonthlyCount(currentUser?.id ?? '', month, year, leaves);
  const capRemaining = rules.agentMonthlyLeaveCap - currentCount;
  const capPct = (currentCount / rules.agentMonthlyLeaveCap) * 100;

  const handleSubmit = async () => {
    const errs: string[] = [];
    if (!windowOpen) errs.push('Leave window closed (22nd–26th).');
    const dateErr = validateDateSelection(selectedDates);
    if (dateErr) errs.push(dateErr);
    const reasonErr = validateReason(reason);
    if (reasonErr) errs.push(reasonErr);
    if (selectedDates.length > capRemaining) errs.push(`Cap exceeded. ${capRemaining} remaining.`);
    if (errs.length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      for (const date of selectedDates) {
        await repo.createLeave({ requesterId: currentUser!.id, departmentId: currentUser!.departmentId!, type: leaveType, date, days: 1, reason, status: 'PendingSupervisor' });
      }
      await refreshLeaves();
      showToast(`${selectedDates.length} leave(s) submitted`, 'success');
      setSelectedDates([]); setReason(''); setErrors([]);
    } catch { showToast('Failed to submit', 'error'); } finally { setSubmitting(false); }
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Leave Application" title="Apply" highlight="Leave"
        description="Select dates, enter reason, submit for approval."
      />

      <div className="glass-card px-4 py-2.5 mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {windowOpen ? (
            <><div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center border border-success/12"><CheckCircle size={13} className="text-success" /></div><div><span className="text-[10px] text-success font-semibold block">Open</span><span className="text-[8px] text-muted-foreground">22–26th</span></div></>
          ) : (
            <><div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center border border-destructive/12"><AlertTriangle size={13} className="text-destructive" /></div><div><span className="text-[10px] text-destructive font-semibold block">Closed</span></div></>
          )}
        </div>
        <div className="w-px h-7 bg-border/25" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-info/10 flex items-center justify-center border border-info/12"><Calendar size={13} className="text-info" /></div>
          <div><span className="text-[10px] font-semibold">{capRemaining}</span><span className="text-[8px] text-muted-foreground block">remaining</span></div>
        </div>
        <div className="w-px h-7 bg-border/25" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center border border-warning/12"><Gauge size={13} className="text-warning" /></div>
          <div><span className="text-[10px] font-semibold">{rules.maxDailyPct}%</span><span className="text-[8px] text-muted-foreground block">max shrink</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <LeaveCalendar month={month} year={year} holidays={holidayMap} blockedDates={blockedDates}
            requestedDates={requestedDates} approvedDates={approvedDates} selectedDates={selectedDates}
            onSelect={setSelectedDates} onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
          />
        </div>

        <div className="lg:col-span-2 glass-card accent-top-card p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold tracking-heading font-heading">Leave Details</h2>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Cap Usage</span>
              <span className="font-bold">{currentCount}/{rules.agentMonthlyLeaveCap}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, capPct)}%` }} transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${capPct >= 100 ? 'bg-destructive' : 'accent-bar'}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold font-heading">Type</label>
            <div className="flex gap-2">
              {(['Planned', 'Swap'] as const).map(t => (
                <button key={t} onClick={() => setLeaveType(t)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${leaveType === t ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-secondary/35 text-muted-foreground border border-border/40'}`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold font-heading">Selected</label>
            {selectedDates.length === 0 ? <p className="text-[10px] text-muted-foreground/40">Click dates →</p> : (
              <div className="flex flex-wrap gap-1.5">
                {selectedDates.map(d => <span key={d} className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold border border-primary/12">{d}</span>)}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-[9px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold font-heading">Reason *</label>
            <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={2} maxLength={200} className="glass-input resize-none text-xs" placeholder="Enter reason..." />
            <div className="text-right text-[9px] text-muted-foreground/30 mt-0.5">{reason.length}/200</div>
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/6 border border-destructive/12 rounded-xl p-3 space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle size={10} className="text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-destructive">{e}</p>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting || !windowOpen || selectedDates.length === 0}
            className="w-full btn-primary-gradient text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-xs"
          >
            {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Send size={13} /> Submit</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
