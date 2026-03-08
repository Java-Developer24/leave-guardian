import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import KpiCard from '@/components/kpis/KpiCard';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { FileText, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';

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
        tag="LEAVE RECORDS"
        title="Leave"
        highlight="Summary"
        description="All your leave requests, filtered by status and type. Manage or cancel pending leaves."
      />

      {/* KPI Row */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Total" value={allMyLeaves.length} icon={<FileText size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
      </motion.div>

      {/* Filters */}
      <div className="glass-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-muted-foreground" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="glass-input w-auto min-w-[150px]"
        >
          <option value="all">All Statuses</option>
          {['Approved', 'PendingSupervisor', 'PendingPeer', 'Rejected', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="glass-input w-auto min-w-[130px]"
        >
          <option value="all">All Types</option>
          {['Planned', 'Unplanned', 'Swap', 'Transfer'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          Showing <strong className="text-foreground">{myLeaves.length}</strong> of {allMyLeaves.length} records
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                {['Date', 'Type', 'Days', 'Reason', 'Peer', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left p-3.5 text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myLeaves.map(l => (
                <tr key={l.id} className="border-b border-border/30 table-row-hover">
                  <td className="p-3.5 font-medium">{formatDate(l.date)}</td>
                  <td className="p-3.5">
                    <span className="text-xs bg-secondary px-2 py-1 rounded-md font-medium">{l.type}</span>
                  </td>
                  <td className="p-3.5">{l.days}</td>
                  <td className="p-3.5 text-muted-foreground max-w-[200px] truncate">{l.reason || '—'}</td>
                  <td className="p-3.5 text-muted-foreground">{l.peerId ? getUserName(l.peerId) : '—'}</td>
                  <td className="p-3.5"><StatusChip status={l.status} /></td>
                  <td className="p-3.5">
                    {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                      <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline font-medium">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {myLeaves.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No leave records match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {myLeaves.map(l => (
            <div key={l.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{formatDate(l.date)}</span>
                <StatusChip status={l.status} />
              </div>
              <div className="text-xs text-muted-foreground">{l.type} • {l.days} day(s){l.peerId ? ` • with ${getUserName(l.peerId)}` : ''}</div>
              {l.reason && <div className="text-xs text-muted-foreground">{l.reason}</div>}
              {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline font-medium">Cancel</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
