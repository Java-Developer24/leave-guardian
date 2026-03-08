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
    return { now: now.toFixed(1), after: after.toFixed(1), exceedsCap: after > cap, cap };
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
        description={`${pending.length} pending request${pending.length !== 1 ? 's' : ''} requiring your review. Monitor shrinkage impact before approving.`}
      />

      <div className="glass-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                {['Agent', 'Date', 'Type', 'Reason', 'Shrinkage Impact', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left p-4 text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map(l => {
                const s = getShrinkageChange(l);
                return (
                  <tr key={l.id} className="border-b border-border/30 table-row-hover">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {getInitials(l.requesterId)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{getUserName(l.requesterId)}</div>
                          <div className="text-[11px] text-muted-foreground">Agent</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium">{formatDate(l.date)}</td>
                    <td className="p-4">
                      <span className="text-[10px] bg-secondary px-2 py-1 rounded-md font-semibold uppercase tracking-wider">{l.type}</span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs max-w-[180px]">{l.reason || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{s.now}%</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className={`text-xs font-bold ${s.exceedsCap ? 'text-destructive' : 'text-success'}`}>{s.after}%</span>
                        {s.exceedsCap && (
                          <span className="flex items-center gap-1 text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-semibold">
                            <AlertTriangle size={10} /> Over {s.cap}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4"><StatusChip status={l.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCommentModal({ id: l.id, action: 'approve' })}
                          className="px-3.5 py-2 text-xs font-semibold bg-success/15 text-success border border-success/25 rounded-lg hover:bg-success/25 transition-all flex items-center gap-1.5"
                        ><CheckCircle size={13} /> Approve</button>
                        <button
                          onClick={() => setCommentModal({ id: l.id, action: 'reject' })}
                          className="px-3.5 py-2 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/25 rounded-lg hover:bg-destructive/25 transition-all flex items-center gap-1.5"
                        ><XCircle size={13} /> Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pending.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center">
                  <CheckCircle size={36} className="mx-auto mb-3 text-success/30" />
                  <p className="text-sm text-muted-foreground">All approvals are processed</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border/30">
          {pending.map(l => {
            const s = getShrinkageChange(l);
            return (
              <div key={l.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{getInitials(l.requesterId)}</div>
                    <div>
                      <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                  <span className="text-xs">{s.now}% → <span className={s.exceedsCap ? 'text-destructive font-bold' : 'text-success font-bold'}>{s.after}%</span></span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCommentModal({ id: l.id, action: 'approve' })} className="flex-1 py-2.5 text-xs font-semibold bg-success/15 text-success border border-success/25 rounded-lg flex items-center justify-center gap-1"><CheckCircle size={13} /> Approve</button>
                  <button onClick={() => setCommentModal({ id: l.id, action: 'reject' })} className="flex-1 py-2.5 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/25 rounded-lg flex items-center justify-center gap-1"><XCircle size={13} /> Reject</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!commentModal} onClose={() => { setCommentModal(null); setComment(''); }} title={commentModal?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Add an optional comment for the agent.</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="glass-input resize-none"
            placeholder="Optional comment..."
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setCommentModal(null); setComment(''); }} className="px-5 py-2.5 text-sm bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-medium">Cancel</button>
            <button onClick={handleAction} className="px-5 py-2.5 text-sm btn-primary-gradient text-primary-foreground rounded-lg font-bold">Confirm</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
