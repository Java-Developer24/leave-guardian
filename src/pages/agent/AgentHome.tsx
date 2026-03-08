import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { formatDate } from '@/core/utils/dates';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send, Activity, Sparkles } from 'lucide-react';

function QuotaRing({ used, cap }: { used: number; cap: number }) {
  const pct = Math.min(100, (used / cap) * 100);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full stat-ring">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke="url(#quota-grad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <defs>
          <linearGradient id="quota-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(354, 100%, 64%)" />
            <stop offset="100%" stopColor="hsl(35, 100%, 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(90deg)' }}>
        <span className="text-xl font-extrabold font-heading">{used}</span>
        <span className="text-[9px] text-muted-foreground font-medium">of {cap}</span>
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
        tag="Agent Dashboard"
        title={`Welcome back,`}
        highlight={currentUser?.name ?? ''}
        description="Your leave overview at a glance. Track quotas, pending requests, and recent activity."
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={myLeaves.length} icon={<FileText size={22} />} accent="primary" trend={{ value: 'YTD', direction: 'neutral' }} sparkline={[2, 3, 5, 4, 6, 8, 7]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={22} />} accent="success" trend={{ value: `${myLeaves.length > 0 ? Math.round((approved / myLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={22} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={22} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Swap / Transfer" value={swapTransfer} icon={<ArrowLeftRight size={22} />} accent="info" sparkline={[1, 2, 1, 3, 2]} /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-6 border-b border-border/20 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-heading font-heading">Pending Requests</h2>
              <p className="text-[11px] text-muted-foreground mt-1">{pendingRequests.length} awaiting action</p>
            </div>
            <Link to="/agent/summary" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle size={40} className="mx-auto mb-4 text-success/25" />
              <p className="text-sm text-muted-foreground font-medium">No pending requests</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/15">
              {pendingRequests.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-5 table-row-hover"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-warning/8 flex items-center justify-center border border-warning/10">
                      <Calendar size={17} className="text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-secondary/50 px-2.5 py-0.5 rounded-lg font-medium border border-border/20">{l.type}</span>
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

        {/* Right */}
        <div className="space-y-5">
          <div className="glass-card gradient-border p-6">
            <h2 className="text-sm font-bold tracking-heading mb-5 flex items-center gap-2 font-heading">
              <Activity size={15} className="text-primary" />
              Monthly Quota
            </h2>
            <div className="flex items-center gap-6">
              <QuotaRing used={monthlyUsed} cap={rules.agentMonthlyLeaveCap} />
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Used', value: monthlyUsed, color: 'text-foreground' },
                  { label: 'Remaining', value: Math.max(0, rules.agentMonthlyLeaveCap - monthlyUsed), color: 'text-success' },
                  { label: 'Cap', value: `${rules.agentMonthlyLeaveCap}/mo`, color: 'text-foreground' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-10">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card accent-top-card p-6">
            <h2 className="text-sm font-bold tracking-heading mb-5 font-heading flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              <Link to="/agent/leave" className="w-full btn-primary-gradient text-primary-foreground font-bold px-4 py-3.5 rounded-2xl flex items-center gap-3 text-sm justify-center">
                <Send size={15} /> Apply Leave
              </Link>
              <Link to="/agent/summary" className="w-full bg-secondary/35 border border-border/40 text-foreground font-medium px-4 py-3 rounded-2xl flex items-center gap-3 text-sm justify-center hover:bg-secondary/55 transition-all">
                <FileText size={15} /> Leave Summary
              </Link>
              <Link to="/agent/requests" className="w-full bg-secondary/35 border border-border/40 text-foreground font-medium px-4 py-3 rounded-2xl flex items-center gap-3 text-sm justify-center hover:bg-secondary/55 transition-all">
                <ArrowLeftRight size={15} /> Swap Requests
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {recentHistory.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold tracking-heading mb-5 font-heading">Recent Activity</h2>
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-border/40 to-transparent" />
            <div className="space-y-5">
              {recentHistory.map(l => (
                <div key={l.id} className="flex items-start gap-5 relative">
                  <div className={`w-[10px] h-[10px] rounded-full mt-1.5 flex-shrink-0 relative z-10 ring-4 ring-background ${l.status === 'Approved' ? 'bg-success' : 'bg-destructive'}`} style={{ boxShadow: l.status === 'Approved' ? '0 0 8px hsla(152,69%,42%,0.4)' : '0 0 8px hsla(0,85%,60%,0.4)' }} />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                      <span className="text-xs text-muted-foreground ml-3">{l.type} • {l.reason}</span>
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
