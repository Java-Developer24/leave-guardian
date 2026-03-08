import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';

export default function AgentSummary() {
  const { currentUser, leaves, repo } = useAppStore();
  const refreshLeaves = useAppStore(s => s.refreshLeaves);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const myLeaves = useMemo(() => {
    let result = leaves.filter(l => l.requesterId === currentUser?.id);
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(l => l.type === typeFilter);
    return result;
  }, [leaves, currentUser, statusFilter, typeFilter]);

  const handleCancel = async (id: string) => {
    await repo.updateLeave(id, { status: 'Cancelled' });
    await refreshLeaves();
    showToast('Leave cancelled', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Leave Summary</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {['Approved', 'PendingSupervisor', 'PendingPeer', 'Rejected', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="all">All Types</option>
          {['Planned', 'Unplanned', 'Swap', 'Transfer'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">Date</th>
                <th className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">Type</th>
                <th className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">Days</th>
                <th className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">Reason</th>
                <th className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.map(l => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-3">{formatDate(l.date)}</td>
                  <td className="p-3">{l.type}</td>
                  <td className="p-3">{l.days}</td>
                  <td className="p-3 text-muted-foreground">{l.reason || '—'}</td>
                  <td className="p-3"><StatusChip status={l.status} /></td>
                  <td className="p-3">
                    {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                      <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {myLeaves.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leave records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {myLeaves.map(l => (
            <div key={l.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{formatDate(l.date)}</span>
                <StatusChip status={l.status} />
              </div>
              <div className="text-sm text-muted-foreground">{l.type} • {l.days} day(s)</div>
              {l.reason && <div className="text-sm text-muted-foreground">{l.reason}</div>}
              {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline">Cancel</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
