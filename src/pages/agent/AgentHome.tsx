import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { formatDate } from '@/core/utils/dates';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send, TrendingUp } from 'lucide-react';

export default function AgentHome() {
  const { currentUser, leaves, users } = useAppStore();
  const myLeaves = leaves.filter(l => l.requesterId === currentUser?.id);

  const approved = myLeaves.filter(l => l.status === 'Approved').length;
  const pending = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(l.status)).length;
  const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
  const swapTransfer = myLeaves.filter(l => l.type === 'Transfer' || l.type === 'Swap').length;

  const pendingRequests = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status));
  const recentHistory = myLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected').slice(0, 4);
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="AGENT DASHBOARD"
        title={`Welcome back,`}
        highlight={currentUser?.name ?? ''}
        description="Your leave overview at a glance. Track quotas, pending requests, and recent activity."
      />

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={myLeaves.length} icon={<FileText size={20} />} accent="primary" trend={{ value: 'YTD', direction: 'neutral' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${myLeaves.length > 0 ? Math.round((approved / myLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Swap / Transfer" value={swapTransfer} icon={<ArrowLeftRight size={20} />} accent="info" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Requests */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-heading">Pending Requests</h2>
            <Link to="/agent/summary" className="text-xs text-primary font-medium hover:underline">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <CheckCircle size={32} className="mx-auto mb-2 text-success/40" />
              No pending requests
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 table-row-hover">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Calendar size={16} className="text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{formatDate(l.date)}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{l.type}</span>
                        {l.peerId && <span className="text-[11px] text-muted-foreground">• with {getUserName(l.peerId)}</span>}
                      </div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="glass-card accent-top-card p-5">
            <h2 className="text-base font-bold tracking-heading mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/agent/leave" className="w-full btn-primary-gradient text-primary-foreground font-semibold px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm justify-center">
                <Send size={15} /> Apply Leave
              </Link>
              <Link to="/agent/summary" className="w-full bg-secondary/60 border border-border text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm justify-center hover:bg-secondary transition-colors">
                <FileText size={15} /> Leave Summary
              </Link>
              <Link to="/agent/requests" className="w-full bg-secondary/60 border border-border text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm justify-center hover:bg-secondary transition-colors">
                <ArrowLeftRight size={15} /> Swap Requests
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-5">
            <h2 className="text-base font-bold tracking-heading mb-3">Recent History</h2>
            {recentHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent history</p>
            ) : (
              <div className="space-y-3">
                {recentHistory.map(l => (
                  <div key={l.id} className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-foreground font-medium">{formatDate(l.date)}</span>
                      <span className="text-muted-foreground ml-1.5">{l.type}</span>
                    </div>
                    <StatusChip status={l.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
