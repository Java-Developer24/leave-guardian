import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { formatDate } from '@/core/utils/dates';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send, Activity, Sparkles, TrendingUp, BarChart3, Users } from 'lucide-react';

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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold font-heading">{used}</span>
        <span className="text-[9px] text-muted-foreground font-medium">of {cap}</span>
      </div>
    </div>
  );
}

export default function AgentHome() {
  const { currentUser, leaves, users, rules, departments, holidays } = useAppStore();
  const myLeaves = leaves.filter(l => l.requesterId === currentUser?.id);
  const myDept = departments.find(d => d.id === currentUser?.departmentId);

  const approved = myLeaves.filter(l => l.status === 'Approved').length;
  const pending = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(l.status)).length;
  const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
  const swapTransfer = myLeaves.filter(l => l.type === 'Transfer' || l.type === 'Swap').length;

  const pendingRequests = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status));
  const recentHistory = myLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected').slice(0, 8);
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyUsed = myLeaves.filter(l =>
    ['Approved', 'PendingSupervisor'].includes(l.status) &&
    new Date(l.date).getMonth() === currentMonth &&
    new Date(l.date).getFullYear() === currentYear
  ).length;

  // Upcoming holidays
  const today = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = holidays.filter(h => h.date >= today).slice(0, 4);

  // Team peers in same dept
  const teamPeers = useMemo(() => {
    return users.filter(u => u.role === 'agent' && u.departmentId === currentUser?.departmentId && u.id !== currentUser?.id).slice(0, 6);
  }, [users, currentUser]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const months = [
      { key: '01', label: 'Jan' }, { key: '02', label: 'Feb' }, { key: '03', label: 'Mar' },
    ];
    return months.map(m => {
      const mLeaves = myLeaves.filter(l => l.date.includes(`-${m.key}-`));
      return { month: m.label, total: mLeaves.length, approved: mLeaves.filter(l => l.status === 'Approved').length };
    });
  }, [myLeaves]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Agent Dashboard"
        title={`Welcome back,`}
        highlight={currentUser?.name ?? ''}
        description={`${myDept?.name ?? 'Your department'} • ${myLeaves.length} total leave requests • ${approved} approved`}
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={myLeaves.length} icon={<FileText size={20} />} accent="primary" trend={{ value: 'YTD', direction: 'neutral' }} sparkline={monthlyBreakdown.map(m => m.total)} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${myLeaves.length > 0 ? Math.round((approved / myLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Swap / Transfer" value={swapTransfer} icon={<ArrowLeftRight size={20} />} accent="info" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Pending Requests */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-border/15 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-heading font-heading">Pending Requests</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">{pendingRequests.length} awaiting action</p>
            </div>
            <Link to="/agent/summary" className="text-[10px] text-primary font-bold hover:underline">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-success/20" />
              <p className="text-sm text-muted-foreground font-medium">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {pendingRequests.slice(0, 6).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-4 table-row-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/8 flex items-center justify-center border border-warning/10">
                      <Calendar size={16} className="text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] bg-secondary/50 px-2 py-0.5 rounded-lg font-medium border border-border/15">{l.type}</span>
                        {l.peerId && <span className="text-[9px] text-muted-foreground">with {getUserName(l.peerId)}</span>}
                      </div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Quota */}
          <div className="glass-card gradient-border p-5">
            <h2 className="text-xs font-bold tracking-heading mb-4 flex items-center gap-2 font-heading">
              <Activity size={14} className="text-primary" /> Monthly Quota
            </h2>
            <div className="flex items-center gap-5">
              <QuotaRing used={monthlyUsed} cap={rules.agentMonthlyLeaveCap} />
              <div className="space-y-2.5 text-xs flex-1">
                {[
                  { label: 'Used', value: monthlyUsed, color: 'text-foreground' },
                  { label: 'Remaining', value: Math.max(0, rules.agentMonthlyLeaveCap - monthlyUsed), color: 'text-success' },
                  { label: 'Cap', value: `${rules.agentMonthlyLeaveCap}/mo`, color: 'text-muted-foreground' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground/60 text-[10px]">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card accent-top-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-4 font-heading flex items-center gap-2">
              <Sparkles size={13} className="text-accent" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/agent/leave" className="w-full btn-primary-gradient text-primary-foreground font-bold px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs justify-center">
                <Send size={14} /> Apply Leave
              </Link>
              <Link to="/agent/summary" className="w-full bg-secondary/30 border border-border/30 text-foreground font-medium px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs justify-center hover:bg-secondary/50 transition-all">
                <FileText size={14} /> Leave Summary
              </Link>
              <Link to="/agent/requests" className="w-full bg-secondary/30 border border-border/30 text-foreground font-medium px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs justify-center hover:bg-secondary/50 transition-all">
                <ArrowLeftRight size={14} /> Swap Requests
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Timeline + Upcoming Holidays + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-xs font-bold tracking-heading mb-4 font-heading flex items-center gap-2">
            <BarChart3 size={14} className="text-info" /> Recent Activity
          </h2>
          {recentHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 text-center py-8">No activity yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-gradient-to-b from-border/30 to-transparent" />
              <div className="space-y-4">
                {recentHistory.map((l, i) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 relative"
                  >
                    <div className={`w-[9px] h-[9px] rounded-full mt-1.5 flex-shrink-0 relative z-10 ring-3 ring-background ${l.status === 'Approved' ? 'bg-success' : 'bg-destructive'}`} />
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold">{formatDate(l.date)}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{l.type}</span>
                        {l.reason && <p className="text-[10px] text-muted-foreground/40 truncate mt-0.5">{l.reason}</p>}
                      </div>
                      <StatusChip status={l.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Holidays + Team */}
        <div className="space-y-4">
          {/* Upcoming Holidays */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-3 font-heading flex items-center gap-2">
              <Calendar size={13} className="text-accent" /> Upcoming Holidays
            </h2>
            {upcomingHolidays.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40">No upcoming holidays</p>
            ) : (
              <div className="space-y-2">
                {upcomingHolidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 border border-border/10">
                    <div>
                      <span className="text-[10px] font-semibold">{h.name}</span>
                      <span className="text-[9px] text-muted-foreground ml-2">{formatDate(h.date)}</span>
                    </div>
                    <span className="text-[8px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/12">{h.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Peers */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-3 font-heading flex items-center gap-2">
              <Users size={13} className="text-info" /> Team Members
            </h2>
            <div className="space-y-2">
              {teamPeers.map(peer => {
                const peerLeaves = leaves.filter(l => l.requesterId === peer.id && l.status === 'Approved').length;
                return (
                  <div key={peer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-[8px] font-bold text-primary border border-primary/8">
                        {peer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[10px] font-medium truncate max-w-[100px]">{peer.name}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{peerLeaves} leaves</span>
                  </div>
                );
              })}
              {teamPeers.length === 0 && <p className="text-[10px] text-muted-foreground/40">No team members found</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
