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
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

function ShrinkageGauge({ now, after, cap }: { now: number; after: number; cap: number }) {
  const nowPct = Math.min(100, (now / (cap * 1.5)) * 100);
  const afterPct = Math.min(100, (after / (cap * 1.5)) * 100);
  const exceedsCap = after > cap;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5 text-[10px]">
        <span className="text-muted-foreground w-8">Now</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${nowPct}%` }} transition={{ duration: 0.6 }} className="h-full bg-info/50 rounded-full" />
        </div>
        <span className="font-semibold w-10 text-right">{now}%</span>
      </div>
      <div className="flex items-center gap-2.5 text-[10px]">
        <span className="text-muted-foreground w-8">After</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${afterPct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
            className={`h-full rounded-full ${exceedsCap ? 'bg-destructive/50' : 'bg-success/50'}`} />
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
        tag="Approval Queue"
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
                  <motion.tr key={l.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/12 to-accent/6 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/8">
                          {getInitials(l.requesterId)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{getUserName(l.requesterId)}</div>
                          <div className="text-[10px] text-muted-foreground">Agent</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold">{formatDate(l.date)}</td>
                    <td><span className="text-[10px] bg-secondary/50 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider border border-border/15">{l.type}</span></td>
                    <td className="text-muted-foreground text-xs max-w-[160px]">{l.reason || '—'}</td>
                    <td className="min-w-[220px]">
                      <ShrinkageGauge now={s.now} after={s.after} cap={s.cap} />
                      {s.exceedsCap && (
                        <span className="flex items-center gap-1 text-[9px] bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full font-bold mt-1.5 w-fit border border-destructive/10">
                          <AlertTriangle size={9} /> Exceeds {s.cap}%
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setCommentModal({ id: l.id, action: 'approve' })}
                          className="px-4 py-2.5 text-xs font-bold bg-success/8 text-success border border-success/15 rounded-xl hover:bg-success/15 transition-all flex items-center gap-1.5">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => setCommentModal({ id: l.id, action: 'reject' })}
                          className="px-4 py-2.5 text-xs font-bold bg-destructive/8 text-destructive border border-destructive/15 rounded-xl hover:bg-destructive/15 transition-all flex items-center gap-1.5">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {pending.length === 0 && (
                <tr><td colSpan={6} className="p-16 text-center">
                  <CheckCircle size={44} className="mx-auto mb-4 text-success/20" />
                  <p className="text-sm text-muted-foreground font-medium">All approvals are processed</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border/15">
          {pending.map(l => {
            const s = getShrinkageChange(l);
            return (
              <div key={l.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{getInitials(l.requesterId)}</div>
                    <div>
                      <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                </div>
                <ShrinkageGauge now={s.now} after={s.after} cap={s.cap} />
                <div className="flex gap-2">
                  <button onClick={() => setCommentModal({ id: l.id, action: 'approve' })} className="flex-1 py-3 text-xs font-bold bg-success/8 text-success border border-success/15 rounded-xl flex items-center justify-center gap-1"><CheckCircle size={13} /> Approve</button>
                  <button onClick={() => setCommentModal({ id: l.id, action: 'reject' })} className="flex-1 py-3 text-xs font-bold bg-destructive/8 text-destructive border border-destructive/15 rounded-xl flex items-center justify-center gap-1"><XCircle size={13} /> Reject</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!commentModal} onClose={() => { setCommentModal(null); setComment(''); }} title={commentModal?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}>
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Add an optional comment for the agent.</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="glass-input resize-none" placeholder="Optional comment..." />
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setCommentModal(null); setComment(''); }} className="px-6 py-3 text-sm bg-secondary/50 rounded-2xl font-medium hover:bg-secondary/70 transition-colors">Cancel</button>
            <button onClick={handleAction} className="px-6 py-3 text-sm btn-primary-gradient text-primary-foreground rounded-2xl font-bold">Confirm</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
