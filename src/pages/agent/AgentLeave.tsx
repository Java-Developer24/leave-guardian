import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import StatusChip from '@/components/StatusChip';
import { getNextMonth, toDateStr, getDaysInMonth, isTodayInWindowForMonth, formatDate } from '@/core/utils/dates';
import { isDayBlocked, agentMonthlyCount } from '@/core/utils/shrinkage';
import { validateReason, validateDateSelection } from '@/core/utils/validation';
import { showToast } from '@/components/toasts/ToastContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Send, AlertTriangle, CheckCircle, Calendar, Gauge, Info, Clock, ArrowLeftRight } from 'lucide-react';

export default function AgentLeave() {
  const { currentUser, leaves, holidays, rules, leaveWindow, schedule, repo, refreshLeaves, users } = useAppStore();
  const next = getNextMonth();
  const [year, setYear] = useState(next.year);
  const [month, setMonth] = useState(next.month);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<'Planned' | 'Swap'>('Planned');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Swap form state
  const [swapPeer, setSwapPeer] = useState('');
  const [swapMyDate, setSwapMyDate] = useState('');
  const [swapPeerDate, setSwapPeerDate] = useState('');
  const [swapComments, setSwapComments] = useState('');

  // Pass form state
  const [passPeer, setPassPeer] = useState('');
  const [passDate, setPassDate] = useState('');
  const [passComments, setPassComments] = useState('');

  const windowOpen = leaveWindow.open && isTodayInWindowForMonth(leaveWindow);
  const holidayMap = useMemo(() => { const m: Record<string, string> = {}; holidays.forEach(h => { m[h.date] = h.name; }); return m; }, [holidays]);
  const blockedDates = useMemo(() => { const s = new Set<string>(); getDaysInMonth(year, month).forEach(d => { const ds = toDateStr(d); if (isDayBlocked(ds, leaves, schedule, rules, holidays)) s.add(ds); }); return s; }, [year, month, leaves, schedule, rules, holidays]);
  const requestedDates = useMemo(() => new Set(leaves.filter(l => l.requesterId === currentUser?.id && ['PendingSupervisor', 'Submitted'].includes(l.status)).map(l => l.date)), [leaves, currentUser]);
  const approvedDates = useMemo(() => new Set(leaves.filter(l => l.requesterId === currentUser?.id && l.status === 'Approved').map(l => l.date)), [leaves, currentUser]);

  const currentCount = agentMonthlyCount(currentUser?.id ?? '', month, year, leaves);
  const capRemaining = rules.agentMonthlyLeaveCap - currentCount;
  const capPct = (currentCount / rules.agentMonthlyLeaveCap) * 100;

  const myLeaves = leaves.filter(l => l.requesterId === currentUser?.id);
  const recentLeaves = myLeaves.slice(0, 5);

  const deptPeers = useMemo(() => users.filter(u => u.role === 'agent' && u.departmentId === currentUser?.departmentId && u.id !== currentUser?.id), [users, currentUser]);

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

  const handleSwapSubmit = async () => {
    if (!swapPeer || !swapMyDate || !swapPeerDate) { showToast('Please fill all swap fields', 'error'); return; }
    setSubmitting(true);
    try {
      await repo.createLeave({ requesterId: currentUser!.id, departmentId: currentUser!.departmentId!, type: 'Swap', date: swapMyDate, days: 1, reason: swapComments || 'Swap request', status: 'PendingPeer', peerId: swapPeer });
      await refreshLeaves();
      showToast('Swap request submitted', 'success');
      setSwapPeer(''); setSwapMyDate(''); setSwapPeerDate(''); setSwapComments('');
    } catch { showToast('Failed to submit', 'error'); } finally { setSubmitting(false); }
  };

  const handlePassSubmit = async () => {
    if (!passPeer || !passDate) { showToast('Please fill all fields', 'error'); return; }
    setSubmitting(true);
    try {
      await repo.createLeave({ requesterId: currentUser!.id, departmentId: currentUser!.departmentId!, type: 'Transfer', date: passDate, days: 1, reason: passComments || 'Pass leave request', status: 'PendingPeer', peerId: passPeer });
      await refreshLeaves();
      showToast('Pass leave request submitted', 'success');
      setPassPeer(''); setPassDate(''); setPassComments('');
    } catch { showToast('Failed to submit', 'error'); } finally { setSubmitting(false); }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Leave Application" title="Apply" highlight="Leave"
        description="Select dates, fill in details, and submit for approval."
      />

      <Tabs defaultValue="apply" className="w-full">
        <TabsList className="bg-muted/50 border border-border mb-6">
          <TabsTrigger value="apply" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Apply Leaves</TabsTrigger>
          <TabsTrigger value="swap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Swap Leave</TabsTrigger>
          <TabsTrigger value="pass" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Pass the Leave</TabsTrigger>
        </TabsList>

        {/* ── Apply Leaves Tab ── */}
        <TabsContent value="apply">
          {/* Status Bar */}
          <div className="bg-card border border-border rounded-xl px-5 py-3.5 mb-5 flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3">
              {windowOpen ? (
                <><div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle size={16} className="text-success" /></div><div><span className="text-xs text-success font-bold block">Window Open</span><span className="text-[10px] text-muted-foreground">22nd – 26th</span></div></>
              ) : (
                <><div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle size={16} className="text-destructive" /></div><div><span className="text-xs text-destructive font-bold block">Window Closed</span><span className="text-[10px] text-muted-foreground">Opens 22nd</span></div></>
              )}
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-info" />
              <div><span className="text-base font-extrabold font-heading">{capRemaining}</span><span className="text-[10px] text-muted-foreground ml-1">days remaining</span></div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Gauge size={16} className="text-warning" />
              <div><span className="text-base font-extrabold font-heading">{rules.maxDailyPct}%</span><span className="text-[10px] text-muted-foreground ml-1">max shrinkage</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <LeaveCalendar month={month} year={year} holidays={holidayMap} blockedDates={blockedDates}
                requestedDates={requestedDates} approvedDates={approvedDates} selectedDates={selectedDates}
                onSelect={setSelectedDates} onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
              />
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* Leave Details Form */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold font-heading flex items-center gap-2">
                  <Info size={15} className="text-primary" /> Leave Details
                </h2>

                {/* Cap Usage */}
                <div className="bg-muted/30 rounded-xl p-3.5 border border-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Monthly Leave Balance</span>
                    <span className="font-bold">{currentCount} / {rules.agentMonthlyLeaveCap}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, capPct)}%` }} transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${capPct >= 100 ? 'bg-destructive' : 'accent-bar'}`}
                    />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Leave Type</label>
                  <div className="flex gap-2">
                    {(['Planned', 'Swap'] as const).map(t => (
                      <button key={t} onClick={() => setLeaveType(t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${leaveType === t ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground border border-border hover:border-primary/30'}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Selected Dates */}
                <div>
                  <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Selected Dates</label>
                  {selectedDates.length === 0 ? <p className="text-xs text-muted-foreground/50 py-1">Click dates on the calendar</p> : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDates.map(d => <span key={d} className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-bold border border-primary/15">{d}</span>)}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Reason *</label>
                  <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={200} className="glass-input resize-none text-sm" placeholder="Enter reason..." />
                  <div className="text-right text-[10px] text-muted-foreground/40 mt-0.5">{reason.length}/200</div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-3 space-y-1">
                    {errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertTriangle size={11} className="text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-destructive">{e}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={submitting || !windowOpen || selectedDates.length === 0}
                  className="w-full btn-primary-gradient font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-sm"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Send size={14} /> Submit Leave Request</>}
                </button>
              </div>

              {/* Calendar Legend */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-bold mb-3 font-heading">Legend</h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { color: 'bg-success/20 border-success/30', label: 'Available' },
                    { color: 'bg-primary/20 border-primary/30', label: 'Approved Leaves' },
                    { color: 'bg-warning/20 border-warning/30', label: 'Pending' },
                    { color: 'bg-accent/20 border-accent/30', label: 'Holidays' },
                    { color: 'bg-muted border-border', label: 'Unavailable' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded border ${item.color}`} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Leave Requests */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-bold mb-3 font-heading flex items-center gap-2">
                  <Clock size={13} className="text-warning" /> My Leave Requests
                </h3>
                {recentLeaves.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 text-center py-4">No requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentLeaves.map(l => (
                      <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border">
                        <div>
                          <span className="text-xs font-semibold">{formatDate(l.date)}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{l.type}</span>
                        </div>
                        <StatusChip status={l.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Swap Leave Tab ── */}
        <TabsContent value="swap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-base font-bold font-heading flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-info" /> Swap Leave Request
              </h2>
              <p className="text-xs text-muted-foreground">Exchange your leave date with a peer's date. Both parties must agree.</p>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Select Peer (OHR/Name)</label>
                <select value={swapPeer} onChange={e => setSwapPeer(e.target.value)} className="glass-input text-sm">
                  <option value="">Select a team member...</option>
                  {deptPeers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Your Date</label>
                  <input type="date" value={swapMyDate} onChange={e => setSwapMyDate(e.target.value)} className="glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Peer Date</label>
                  <input type="date" value={swapPeerDate} onChange={e => setSwapPeerDate(e.target.value)} className="glass-input text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Comments</label>
                <textarea value={swapComments} onChange={e => setSwapComments(e.target.value)} rows={4} maxLength={500} className="glass-input resize-none text-sm" placeholder="Add any notes for the peer..." />
                <div className="text-right text-[10px] text-muted-foreground/40 mt-0.5">{swapComments.length}/500</div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSwapSubmit} disabled={submitting} className="flex-1 btn-primary-gradient font-bold py-3 rounded-xl text-sm disabled:opacity-40">
                  {submitting ? 'Submitting...' : 'Submit Swap Request'}
                </button>
                <button onClick={() => { setSwapPeer(''); setSwapMyDate(''); setSwapPeerDate(''); setSwapComments(''); }} className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
                  Cancel
                </button>
              </div>
            </div>

            {/* Right sidebar info */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-xs font-bold mb-3 font-heading flex items-center gap-2"><Info size={13} className="text-info" /> How Swap Works</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>1. Select a peer from your department</p>
                  <p>2. Choose the date you want to swap</p>
                  <p>3. Select the peer's date to exchange</p>
                  <p>4. Peer will receive a notification to approve</p>
                  <p>5. Once approved, supervisor reviews the swap</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-xs font-bold mb-3 font-heading flex items-center gap-2"><Calendar size={13} className="text-primary" /> {monthNames[month - 1]} Leave Balance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Monthly Quota</span>
                    <span className="font-bold">{rules.agentMonthlyLeaveCap}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full accent-bar rounded-full" style={{ width: `${Math.min(100, capPct)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Used: {currentCount}</span>
                    <span>Remaining: {capRemaining}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Pass the Leave Tab ── */}
        <TabsContent value="pass">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-base font-bold font-heading flex items-center gap-2">
                <Send size={18} className="text-accent" /> Pass the Leave
              </h2>
              <p className="text-xs text-muted-foreground">Transfer your approved or pending leave to a peer.</p>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Select Peer</label>
                <select value={passPeer} onChange={e => setPassPeer(e.target.value)} className="glass-input text-sm">
                  <option value="">Select a team member...</option>
                  {deptPeers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Leave Date to Pass</label>
                <input type="date" value={passDate} onChange={e => setPassDate(e.target.value)} className="glass-input text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Comments</label>
                <textarea value={passComments} onChange={e => setPassComments(e.target.value)} rows={4} maxLength={500} className="glass-input resize-none text-sm" placeholder="Reason for passing the leave..." />
                <div className="text-right text-[10px] text-muted-foreground/40 mt-0.5">{passComments.length}/500</div>
              </div>

              <div className="flex gap-3">
                <button onClick={handlePassSubmit} disabled={submitting} className="flex-1 btn-primary-gradient font-bold py-3 rounded-xl text-sm disabled:opacity-40">
                  {submitting ? 'Submitting...' : 'Submit Pass Request'}
                </button>
                <button onClick={() => { setPassPeer(''); setPassDate(''); setPassComments(''); }} className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors">
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold mb-3 font-heading flex items-center gap-2"><Info size={13} className="text-accent" /> How Pass Works</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>1. Select a peer from your department</p>
                <p>2. Choose the leave date to transfer</p>
                <p>3. Peer will receive notification to accept</p>
                <p>4. Once accepted, supervisor reviews the transfer</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}