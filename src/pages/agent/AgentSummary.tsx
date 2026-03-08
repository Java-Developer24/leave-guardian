import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import KpiCard from '@/components/kpis/KpiCard';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { FileText, CheckCircle, Clock, XCircle, Filter, ArrowLeftRight, Search, Inbox } from 'lucide-react';

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
    showToast('Cancelled', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Leave Records" title="Leave" highlight="Summary"
        description="View all your leave requests — filter, manage, and cancel."
      />

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Total Requests" value={allMyLeaves.length} icon={<FileText size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${allMyLeaves.length > 0 ? Math.round((approved / allMyLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
      </motion.div>

      {/* Filter Bar */}
      <div className="glass-card px-5 py-3.5 mb-5 flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/15"><Filter size={15} className="text-muted-foreground" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input w-auto min-w-[160px] py-2.5 text-xs">
          <option value="all">All Statuses</option>
          {['Approved', 'PendingSupervisor', 'PendingPeer', 'Rejected', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input w-auto min-w-[140px] py-2.5 text-xs">
          <option value="all">All Types</option>
          {['Planned', 'Unplanned', 'Swap', 'Transfer'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          Showing <strong className="text-foreground">{myLeaves.length}</strong> of {allMyLeaves.length} records
        </span>
      </div>

      {/* Table */}
      <div className="glass-card-featured overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm premium-table">
            <thead><tr>{['Date', 'Type', 'Days', 'Reason', 'Peer', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myLeaves.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <td className="font-semibold">{formatDate(l.date)}</td>
                  <td>
                    <span className="text-[10px] bg-secondary/60 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1 w-fit border border-border/20">
                      {(l.type === 'Swap' || l.type === 'Transfer') && <ArrowLeftRight size={10} />}{l.type}
                    </span>
                  </td>
                  <td>{l.days}</td>
                  <td className="text-muted-foreground max-w-[180px] truncate">{l.reason || '—'}</td>
                  <td className="text-muted-foreground">{l.peerId ? getUserName(l.peerId) : '—'}</td>
                  <td><StatusChip status={l.status} /></td>
                  <td>
                    {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                      <button onClick={() => handleCancel(l.id)} className="text-xs text-destructive hover:underline font-semibold hover:bg-destructive/8 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {myLeaves.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center">
                  <Inbox size={28} className="mx-auto mb-3 text-muted-foreground/15" />
                  <p className="text-muted-foreground text-sm">No records found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border/20">
          {myLeaves.map(l => (
            <div key={l.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{formatDate(l.date)}</span>
                <StatusChip status={l.status} />
              </div>
              <div className="text-xs text-muted-foreground">{l.type} • {l.days}d{l.peerId ? ` • ${getUserName(l.peerId)}` : ''}</div>
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
