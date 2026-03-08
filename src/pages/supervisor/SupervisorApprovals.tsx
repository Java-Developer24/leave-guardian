import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { showToast } from '@/components/toasts/ToastContainer';
import Modal from '@/components/modals/Modal';

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

  const getShrinkageChange = (leave: typeof pending[0]) => {
    const now = calcDailyShrinkage(leave.date, leaves, schedule);
    const afterLeaves = [...leaves, { ...leave, status: 'Approved' as const }];
    const after = calcDailyShrinkage(leave.date, afterLeaves, schedule);
    const holiday = holidays.find(h => h.date === leave.date);
    const cap = holiday?.allowedShrinkagePct ?? rules.maxDailyPct;
    return { now: now.toFixed(1), after: after.toFixed(1), exceedsCap: after > cap };
  };

  const handleAction = async () => {
    if (!commentModal) return;
    const { id, action } = commentModal;
    if (action === 'approve') {
      await repo.approveLeave(id, currentUser!.id, comment || undefined);
      showToast('Leave approved', 'success');
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
      <h1 className="text-2xl font-bold tracking-heading mb-6">Approvals</h1>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Agent', 'Date', 'Type', 'Reason', 'Shrinkage', 'Actions'].map(h => (
                  <th key={h} className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map(l => {
                const s = getShrinkageChange(l);
                return (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-medium">{getUserName(l.requesterId)}</td>
                    <td className="p-3">{formatDate(l.date)}</td>
                    <td className="p-3">{l.type}</td>
                    <td className="p-3 text-muted-foreground">{l.reason || '—'}</td>
                    <td className="p-3">
                      <span className="text-xs">
                        {s.now}% → <span className={s.exceedsCap ? 'text-destructive font-bold' : 'text-success'}>{s.after}%</span>
                      </span>
                      {s.exceedsCap && <span className="ml-1 text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">⚠ Over cap</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCommentModal({ id: l.id, action: 'approve' })}
                          className="px-3 py-1.5 text-xs font-medium bg-success/20 text-success border border-success/30 rounded-md hover:bg-success/30 transition-colors"
                        >Approve</button>
                        <button
                          onClick={() => setCommentModal({ id: l.id, action: 'reject' })}
                          className="px-3 py-1.5 text-xs font-medium bg-destructive/20 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/30 transition-colors"
                        >Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pending.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No pending approvals</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {pending.map(l => {
            const s = getShrinkageChange(l);
            return (
              <div key={l.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{getUserName(l.requesterId)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                  </div>
                  <span className="text-xs">{s.now}% → {s.after}%</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCommentModal({ id: l.id, action: 'approve' })} className="flex-1 px-3 py-2 text-xs font-medium bg-success/20 text-success border border-success/30 rounded-md">Approve</button>
                  <button onClick={() => setCommentModal({ id: l.id, action: 'reject' })} className="flex-1 px-3 py-2 text-xs font-medium bg-destructive/20 text-destructive border border-destructive/30 rounded-md">Reject</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!commentModal} onClose={() => { setCommentModal(null); setComment(''); }} title={commentModal?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Comment (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setCommentModal(null); setComment(''); }} className="px-4 py-2 text-sm bg-secondary rounded-md hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleAction} className="px-4 py-2 text-sm btn-primary-gradient text-primary-foreground rounded-md font-medium">Confirm</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
