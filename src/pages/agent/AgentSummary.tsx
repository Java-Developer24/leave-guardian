import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import KpiCard from '@/components/kpis/KpiCard';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { FileText, CheckCircle, Clock, XCircle, Filter, ArrowLeftRight } from 'lucide-react';

export default function AgentSummary() {
  const { currentUser, leaves, repo, users } = useAppStore();
  const refreshLeaves = useAppStore(s => s.refreshLeaves);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const myLeaves = useMemo(() => {
    let result = leaves.filter(l => l.requesterId === currentUser?.id);
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(l => l.type === typeFilter);
    return result;
  }, [leaves, currentUser, statusFilter, typeFilter]);

  const allMyLeaves = leaves.filter(l => l.requesterId === currentUser?.id);
  const approved = allMyLeaves.filter(l => l.status === 'Approved').length;
  const pending = allMyLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status)).length;
  const rejected = allMyLeaves.filter(l => l.status === 'Rejected').length;
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const handleCancel = async (id: string) => {
    await repo.updateLeave(id, { status: 'Cancelled' });
    await refreshLeaves();
    showToast('Leave cancelled successfully', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Leave Records"
        title="Leave"
        highlight="Summary"
        description="All your leave requests, filtered by status and type. Manage or cancel pending leaves."
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total" value={allMyLeaves.length} icon={<FileText size={22} />} accent="primary" sparkline={[3, 5, 4, 6, 7, 8]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={22} />} accent="success" trend={{ value: `${allMyLeaves.length > 0 ? Math.round((approved / allMyLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={22} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={22} />} accent="primary" /></motion.div>
      </motion.div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
          <Filter size={15} className="text-muted-foreground" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input w-auto min-w-[160px]">
          <option value="all">All Statuses</option>
          {['Approved', 'PendingSupervisor', 'PendingPeer', 'Rejected', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input w-auto min-w-[140px]">
          <option value="all">All Types</option>
          {['Planned', 'Unplanned', 'Swap', 'Transfer'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          Showing <strong className="text-foreground font-semibold">{myLeaves.length}</strong> of {allMyLeaves.length}
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm premium-table">
            <thead>
              <tr>
                {['Date', 'Type', 'Days', 'Reason', 'Peer', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myLeaves.map((l, i) => (
                <motion.tr
                  key={l.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="font-semibold">{formatDate(l.date)}</td>
                  <td>
                    <span className="text-[10px] bg-secondary/50 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 w-fit border border-border/15">
                      {(l.type === 'Swap' || l.type === 'Transfer') && <ArrowLeftRight size={10} />}
                      {l.type}
                    </span>
                  </td>
                  <td>{l.days}</td>
                  <td className="text-muted-foreground max-w-[200px] truncate">{l.reason || '—'}</td>
                  <td className="text-muted-foreground">{l.peerId ? getUserName(l.peerId) : '—'}</td>
                  <td><StatusChip status={l.status} /></td>
                  <td>
                    {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                      <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline font-semibold hover:bg-destructive/8 px-3 py-1.5 rounded-xl transition-colors">
                        Cancel
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {myLeaves.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No leave records match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border/20">
          {myLeaves.map(l => (
            <div key={l.id} className="p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{formatDate(l.date)}</span>
                <StatusChip status={l.status} />
              </div>
              <div className="text-[11px] text-muted-foreground">{l.type} • {l.days} day(s){l.peerId ? ` • with ${getUserName(l.peerId)}` : ''}</div>
              {l.reason && <div className="text-[11px] text-muted-foreground">{l.reason}</div>}
              {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline font-semibold">Cancel</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
