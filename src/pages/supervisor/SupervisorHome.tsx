import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { toDateStr, formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, CheckSquare, AlertTriangle, Users, Clock, Calendar, Gauge, Shield, Target, Check, X } from 'lucide-react';

export default function SupervisorHome() {
  const { leaves, schedule, rules, currentUser, users, repo, departments } = useAppStore();
  const refreshLeaves = useAppStore(s => s.refreshLeaves);
  const deptId = currentUser?.departmentId ?? 'd1';
  const myDept = departments.find(d => d.id === deptId);

  const deptLeaves = leaves.filter(l => l.departmentId === deptId);
  const approvedCount = deptLeaves.filter(l => l.status === 'Approved').length;
  const totalDecided = deptLeaves.filter(l => ['Approved', 'Rejected'].includes(l.status)).length;
  const approvalRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0;

  const todayStr = toDateStr(new Date());
  const currentShrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);
  const pending = deptLeaves.filter(l => l.status === 'PendingSupervisor');
  const teamAgents = users.filter(u => u.role === 'agent' && u.departmentId === deptId);
  const teamSize = teamAgents.length;
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Working hours mock
  const totalWorkHrs = teamSize * 8;
  const currentWorkHrs = Math.round(totalWorkHrs * (1 - currentShrinkage / 100));

  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    await repo.updateLeave(id, { status: 'Approved' });
    await refreshLeaves();
    showToast('Leave approved', 'success');
  };

  const handleReject = async (id: string) => {
    await repo.updateLeave(id, { status: 'Rejected' });
    await refreshLeaves();
    showToast('Leave rejected', 'success');
  };

  // Team leave summary
  const teamSummary = useMemo(() => {
    return teamAgents.map(agent => {
      const agentLeaves = deptLeaves.filter(l => l.requesterId === agent.id);
      const planned = agentLeaves.filter(l => l.type === 'Planned').length;
      const unplanned = agentLeaves.filter(l => l.type === 'Unplanned').length;
      const approved = agentLeaves.filter(l => l.status === 'Approved').length;
      const pendingCount = agentLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status)).length;
      return { id: agent.id, name: agent.name, planned, unplanned, approved, pending: pendingCount, workHrs: 8 * 20 - approved * 8 };
    }).slice(0, 15);
  }, [teamAgents, deptLeaves]);

  return (
    <motion.div {...pageTransition}>
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-heading font-heading">
          Welcome, <span className="text-primary">{currentUser?.name}</span> <span className="text-muted-foreground text-lg">(Supervisor)</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{myDept?.name ?? 'Department'}</p>
      </div>

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Pending Request" value={pending.length} icon={<Clock size={18} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={18} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Working Hours" value={`${currentWorkHrs}/${totalWorkHrs}`} icon={<Calendar size={18} />} accent="info" subtitle="hrs today" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Size" value={teamSize} icon={<Users size={18} />} accent="accent" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Shrinkage Level" value={`${currentShrinkage.toFixed(1)}%`} icon={<Gauge size={18} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} subtitle={`Cap: ${rules.maxDailyPct}%`} /></motion.div>
      </motion.div>

      {/* Pending Leave Requests */}
      <div className="mb-6">
        <h2 className="text-base font-bold font-heading mb-4 flex items-center gap-2">
          <Clock size={16} className="text-warning" /> Pending Leave Requests
          <span className="text-xs text-muted-foreground font-normal ml-2">{pending.length} requests need your action</span>
        </h2>

        {pending.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-12 text-center">
            <CheckSquare size={28} className="mx-auto mb-3 text-success/30" />
            <p className="text-sm text-muted-foreground font-medium">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.slice(0, 8).map((l, i) => {
              const potentialShrinkage = currentShrinkage + 1.2;
              const isHighRisk = potentialShrinkage > rules.maxDailyPct * 0.8;
              return (
                <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 space-y-3"
                >
                  {/* Agent Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/15">
                        {getInitials(l.requesterId)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                        <div className="text-[10px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                      </div>
                    </div>
                    <StatusChip status={l.status} />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/30 rounded-lg p-2 border border-border">
                      <span className="text-muted-foreground block text-[9px]">Date</span>
                      <span className="font-semibold">{formatDate(l.date)}</span>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2 border border-border">
                      <span className="text-muted-foreground block text-[9px]">Leave Type</span>
                      <span className="font-semibold">{l.type}</span>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2 border border-border">
                      <span className="text-muted-foreground block text-[9px]">Reason</span>
                      <span className="font-semibold truncate block">{l.reason || '—'}</span>
                    </div>
                  </div>

                  {/* Shrinkage Warning */}
                  <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${isHighRisk ? 'bg-destructive/5 border-destructive/15 text-destructive' : 'bg-warning/5 border-warning/15 text-warning'}`}>
                    <AlertTriangle size={13} />
                    <span>Current Shrinkage: <strong>{currentShrinkage.toFixed(1)}%</strong></span>
                    <span className="mx-1">•</span>
                    <span>Approving leads to <strong>{potentialShrinkage.toFixed(1)}%</strong></span>
                  </div>

                  {/* Review Notes */}
                  <textarea
                    value={reviewNotes[l.id] || ''}
                    onChange={e => setReviewNotes(prev => ({ ...prev, [l.id]: e.target.value }))}
                    placeholder="Review notes (optional)..."
                    rows={2}
                    className="glass-input text-xs resize-none"
                  />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(l.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-success/10 text-success border border-success/20 rounded-xl text-xs font-bold hover:bg-success/20 transition-colors"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(l.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-destructive/5 text-destructive border border-destructive/15 rounded-xl text-xs font-bold hover:bg-destructive/10 transition-colors"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Leave Summary Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold font-heading flex items-center gap-2">
            <Users size={15} className="text-info" /> Team Leave Summary
          </h2>
          <Link to="/supervisor/team" className="text-[10px] text-primary font-bold hover:underline">View full team →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm premium-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Planned Leave</th>
                <th>Unplanned Leave</th>
                <th>Approved Leave</th>
                <th>Pending Leave</th>
                <th>Working Hours (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {teamSummary.map((agent, i) => (
                <motion.tr key={agent.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary border border-primary/15">
                        {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-semibold">{agent.name}</span>
                    </div>
                  </td>
                  <td>{agent.planned}</td>
                  <td>{agent.unplanned}</td>
                  <td className="text-success font-semibold">{agent.approved}</td>
                  <td>{agent.pending > 0 ? <span className="text-warning font-bold">{agent.pending}</span> : '0'}</td>
                  <td>{agent.workHrs}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}