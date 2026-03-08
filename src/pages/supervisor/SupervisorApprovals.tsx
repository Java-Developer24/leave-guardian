import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { showToast } from '@/components/toasts/ToastContainer';
import Modal from '@/components/modals/Modal';
import { AlertTriangle, CheckCircle, XCircle, Gauge } from 'lucide-react';

function ShrinkageGauge({ now, after, cap }: { now: number; after: number; cap: number }) {
  const nowPct = Math.min(100, (now / (cap * 1.5)) * 100);
  const afterPct = Math.min(100, (after / (cap * 1.5)) * 100);
  const exceedsCap = after > cap;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-muted-foreground">Now</span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${nowPct}%` }} transition={{ duration: 0.5 }} className="h-full bg-info/60 rounded-full" />
        </div>
        <span className="font-semibold w-10 text-right">{now}%</span>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-muted-foreground">After</span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${afterPct}%` }} transition={{ duration: 0.5, delay: 0.1 }}
            className={`h-full rounded-full ${exceedsCap ? 'bg-destructive/60' : 'bg-success/60'}`} />
        </div>
        <span className={`font-bold w-10 text-right ${exceedsCap ? 'text-destructive' : 'text-success'}`}>{after}%</span>
      </div>
    </div>
  );
}

export default function SupervisorApprovals() {
  const { currentUser, leaves, users, schedule, rules, holidays, repo, refreshLeaves } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';
  const [commentModal, setCommentModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');

  const pending = useMemo(() =>
    leaves.filter(l => l.departmentId === deptId && l.status === 'PendingSupervisor'),
    [leaves, deptId]
  );

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const getShrinkageChange = (leave: typeof pending[0]) => {
    const now = calcDailyShrinkage(leave.date, leaves, schedule);
    const afterLeaves = [...leaves, { ...leave, status: 'Approved' as const }];
    const after = calcDailyShrinkage(leave.date, afterLeaves, schedule);
    const holiday = holidays.find(h => h.date === leave.date);
    const cap = holiday?.allowedShrinkagePct ?? rules.maxDailyPct;
    return { now: parseFloat(now.toFixed(1)), after: parseFloat(after.toFixed(1)), exceedsCap: after > cap, cap };
  };

  const handleAction = async () => {
    if (!commentModal) return;
    const { id, action } = commentModal;
    if (action === 'approve') {
      await repo.approveLeave(id, currentUser!.id, comment || undefined);
      showToast('Leave approved successfully', 'success');
    } else {
      await repo.rejectLeave(id, currentUser!.id, comment || undefined);
      showToast('Leave rejected', 'info');
    }
    await refreshLeaves();
    setCommentModal(null);
    setComment('');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="APPROVAL QUEUE"
        title="Leave"
        highlight="Approvals"
        description={`${pending.length} pending request${pending.length !== 1 ? 's' : ''} requiring your review.`}
      />

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm premium-table">
            <thead>
              <tr>
                {['Agent', 'Date', 'Type', 'Reason', 'Shrinkage Impact', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map((l, i) => {
                const s = getShrinkageChange(l);
                return (
                  <motion.tr key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                          {getInitials(l.requesterId)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{getUserName(l.requesterId)}</div>
                          <div className="text-[10px] text-muted-foreground">Agent</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold">{formatDate(l.date)}</td>
                    <td><span className="text-[10px] bg-secondary/60 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">{l.type}</span></td>
                    <td className="text-muted-foreground text-xs max-w-[160px]">{l.reason || '—'}</td>
                    <td className="min-w-[200px]">
                      <ShrinkageGauge now={s.now} after={s.after} cap={s.cap} />
                      {s.exceedsCap && (
                        <span className="flex items-center gap-1 text-[9px] bg-destructive/12 text-destructive px-2 py-0.5 rounded-full font-bold mt-1 w-fit">
                          <AlertTriangle size={9} /> Exceeds {s.cap}%
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setCommentModal({ id: l.id, action: 'approve' })}
                          className="px-3.5 py-2 text-xs font-bold bg-success/10 text-success border border-success/20 rounded-xl hover:bg-success/20 transition-all flex items-center gap-1.5">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => setCommentModal({ id: l.id, action: 'reject' })}
                          className="px-3.5 py-2 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/20 transition-all flex items-center gap-1.5">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {pending.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center">
                  <CheckCircle size={40} className="mx-auto mb-3 text-success/25" />
                  <p className="text-sm text-muted-foreground">All approvals are processed</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border/20">
          {pending.map(l => {
            const s = getShrinkageChange(l);
            return (
              <div key={l.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{getInitials(l.requesterId)}</div>
                    <div>
                      <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                </div>
                <ShrinkageGauge now={s.now} after={s.after} cap={s.cap} />
                <div className="flex gap-2">
                  <button onClick={() => setCommentModal({ id: l.id, action: 'approve' })} className="flex-1 py-2.5 text-xs font-bold bg-success/10 text-success border border-success/20 rounded-xl flex items-center justify-center gap-1"><CheckCircle size={13} /> Approve</button>
                  <button onClick={() => setCommentModal({ id: l.id, action: 'reject' })} className="flex-1 py-2.5 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center justify-center gap-1"><XCircle size={13} /> Reject</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!commentModal} onClose={() => { setCommentModal(null); setComment(''); }} title={commentModal?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Add an optional comment for the agent.</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="glass-input resize-none" placeholder="Optional comment..." />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setCommentModal(null); setComment(''); }} className="px-5 py-2.5 text-sm bg-secondary rounded-xl font-medium hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleAction} className="px-5 py-2.5 text-sm btn-primary-gradient text-primary-foreground rounded-xl font-bold">Confirm</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
