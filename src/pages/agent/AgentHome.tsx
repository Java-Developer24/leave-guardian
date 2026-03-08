import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { formatDate } from '@/core/utils/dates';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send, Activity } from 'lucide-react';

function QuotaRing({ used, cap }: { used: number; cap: number }) {
  const pct = Math.min(100, (used / cap) * 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 96 96" className="w-full h-full stat-ring">
        <circle cx="48" cy="48" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
        <motion.circle
          cx="48" cy="48" r={r} fill="none"
          stroke="url(#quota-grad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <defs>
          <linearGradient id="quota-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(356, 98%, 62%)" />
            <stop offset="100%" stopColor="hsl(37, 100%, 58%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(90deg)' }}>
        <span className="text-lg font-extrabold">{used}</span>
        <span className="text-[9px] text-muted-foreground">of {cap}</span>
      </div>
    </div>
  );
}

export default function AgentHome() {
  const { currentUser, leaves, users, rules } = useAppStore();
  const myLeaves = leaves.filter(l => l.requesterId === currentUser?.id);

  const approved = myLeaves.filter(l => l.status === 'Approved').length;
  const pending = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(l.status)).length;
  const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
  const swapTransfer = myLeaves.filter(l => l.type === 'Transfer' || l.type === 'Swap').length;

  const pendingRequests = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status));
  const recentHistory = myLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected').slice(0, 5);
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyUsed = myLeaves.filter(l =>
    ['Approved', 'PendingSupervisor'].includes(l.status) &&
    new Date(l.date).getMonth() === currentMonth &&
    new Date(l.date).getFullYear() === currentYear
  ).length;

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
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={myLeaves.length} icon={<FileText size={20} />} accent="primary" trend={{ value: 'YTD', direction: 'neutral' }} sparkline={[2, 3, 5, 4, 6, 8, 7]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${myLeaves.length > 0 ? Math.round((approved / myLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Swap / Transfer" value={swapTransfer} icon={<ArrowLeftRight size={20} />} accent="info" sparkline={[1, 2, 1, 3, 2]} /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Requests */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-heading">Pending Requests</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{pendingRequests.length} awaiting action</p>
            </div>
            <Link to="/agent/summary" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-success/30" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {pendingRequests.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 table-row-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Calendar size={16} className="text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-secondary/60 px-2 py-0.5 rounded-md font-medium">{l.type}</span>
                        {l.peerId && <span className="text-[10px] text-muted-foreground">with {getUserName(l.peerId)}</span>}
                      </div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Monthly Quota */}
          <div className="glass-card gradient-border p-5">
            <h2 className="text-sm font-bold tracking-heading mb-4 flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              Monthly Quota
            </h2>
            <div className="flex items-center gap-5">
              <QuotaRing used={monthlyUsed} cap={rules.agentMonthlyLeaveCap} />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-8">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-bold">{monthlyUsed}</span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-bold text-success">{Math.max(0, rules.agentMonthlyLeaveCap - monthlyUsed)}</span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span className="text-muted-foreground">Cap</span>
                  <span className="font-bold">{rules.agentMonthlyLeaveCap}/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card accent-top-card p-5">
            <h2 className="text-sm font-bold tracking-heading mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/agent/leave" className="w-full btn-primary-gradient text-primary-foreground font-semibold px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm justify-center">
                <Send size={15} /> Apply Leave
              </Link>
              <Link to="/agent/summary" className="w-full bg-secondary/40 border border-border/50 text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm justify-center hover:bg-secondary/60 transition-all">
                <FileText size={15} /> Leave Summary
              </Link>
              <Link to="/agent/requests" className="w-full bg-secondary/40 border border-border/50 text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm justify-center hover:bg-secondary/60 transition-all">
                <ArrowLeftRight size={15} /> Swap Requests
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent History Timeline */}
      {recentHistory.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold tracking-heading mb-4">Recent Activity</h2>
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border/30" />
            <div className="space-y-4">
              {recentHistory.map(l => (
                <div key={l.id} className="flex items-start gap-4 relative">
                  <div className={`w-[9px] h-[9px] rounded-full mt-1.5 flex-shrink-0 relative z-10 ring-4 ring-background ${l.status === 'Approved' ? 'bg-success' : 'bg-destructive'}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{formatDate(l.date)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{l.type} • {l.reason}</span>
                    </div>
                    <StatusChip status={l.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
