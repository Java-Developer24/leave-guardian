import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import KpiCard from '@/components/kpis/KpiCard';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Filter, ArrowLeftRight, Search, Inbox, ArrowRight, Repeat, Send } from 'lucide-react';

export default function AgentSummary() {
  const { currentUser, leaves, repo, users, departments } = useAppStore();
  const refreshLeaves = useAppStore(s => s.refreshLeaves);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const myDept = departments.find(d => d.id === currentUser?.departmentId);

  const myLeaves = useMemo(() => {
    let result = leaves.filter(l => l.requesterId === currentUser?.id);
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(l => l.type === typeFilter);
    if (searchTerm) result = result.filter(l => l.reason?.toLowerCase().includes(searchTerm.toLowerCase()));
    return result;
  }, [leaves, currentUser, statusFilter, typeFilter, searchTerm]);

  const allMyLeaves = leaves.filter(l => l.requesterId === currentUser?.id);
  const approved = allMyLeaves.filter(l => l.status === 'Approved').length;
  const pending = allMyLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status)).length;
  const rejected = allMyLeaves.filter(l => l.status === 'Rejected').length;
  const swapped = allMyLeaves.filter(l => l.type === 'Swap' || l.type === 'Transfer').length;
  const rejPct = allMyLeaves.length > 0 ? Math.round((rejected / allMyLeaves.length) * 100) : 0;
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const handleCancel = async (id: string) => {
    await repo.updateLeave(id, { status: 'Cancelled' });
    await refreshLeaves();
    showToast('Cancelled', 'success');
  };

  return (
    <motion.div {...pageTransition}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-heading font-heading">
            Welcome, <span className="text-primary">{currentUser?.name}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{myDept?.name ?? 'Department'} • Leave Summary Dashboard</p>
        </div>
        <Link to="/agent/leave" className="btn-primary-gradient text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <Send size={14} /> Apply Leave
        </Link>
      </div>

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Approved Leaves" value={approved} icon={<CheckCircle size={18} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Leaves In Review" value={pending} icon={<Clock size={18} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Leave Pass/Swapped" value={swapped} icon={<ArrowLeftRight size={18} />} accent="info" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Leave Rejected" value={`${rejPct}%`} icon={<XCircle size={18} />} accent="primary" /></motion.div>
      </motion.div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Filters Applied</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input w-auto min-w-[140px] py-2 text-xs">
          <option value="all">All Statuses</option>
          {['Approved', 'PendingSupervisor', 'PendingPeer', 'Rejected', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input w-auto min-w-[120px] py-2 text-xs">
          <option value="all">All Types</option>
          {['Planned', 'Unplanned', 'Swap', 'Transfer'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search reasons..." className="glass-input pl-8 py-2 text-xs w-[180px]" />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground">{myLeaves.length}</strong> of {allMyLeaves.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm premium-table">
            <thead><tr>{['Start Date', 'End Date', 'Leave Type', 'Category', 'Duration', 'Remark', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {myLeaves.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="font-semibold">{formatDate(l.date)}</td>
                  <td className="font-medium">{formatDate(l.date)}</td>
                  <td>
                    <span className="text-[10px] bg-muted px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1 w-fit border border-border">
                      {(l.type === 'Swap' || l.type === 'Transfer') && <ArrowLeftRight size={10} />}{l.type}
                    </span>
                  </td>
                  <td><span className="text-[10px] bg-info/8 text-info px-2 py-0.5 rounded-lg font-semibold border border-info/15">Paid Leave</span></td>
                  <td>{l.days}d</td>
                  <td className="text-muted-foreground max-w-[160px] truncate">{l.reason || '—'}</td>
                  <td><StatusChip status={l.status} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {l.type !== 'Swap' && ['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                        <button title="Swap" className="p-1.5 rounded-lg hover:bg-info/8 text-info transition-colors"><Repeat size={13} /></button>
                      )}
                      {l.type !== 'Transfer' && ['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                        <button title="Pass" className="p-1.5 rounded-lg hover:bg-accent/10 text-accent transition-colors"><ArrowRight size={13} /></button>
                      )}
                      {['PendingSupervisor', 'PendingPeer', 'Approved'].includes(l.status) && (
                        <button onClick={() => handleCancel(l.id)} title="Cancel" className="p-1.5 rounded-lg hover:bg-destructive/8 text-destructive transition-colors"><XCircle size={13} /></button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {myLeaves.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center">
                  <Inbox size={24} className="mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm">No records found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {myLeaves.map(l => (
            <div key={l.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{formatDate(l.date)}</span>
                <StatusChip status={l.status} />
              </div>
              <div className="text-xs text-muted-foreground">{l.type} • {l.days}d{l.peerId ? ` • ${getUserName(l.peerId)}` : ''}</div>
              {l.reason && <div className="text-xs text-muted-foreground truncate">{l.reason}</div>}
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