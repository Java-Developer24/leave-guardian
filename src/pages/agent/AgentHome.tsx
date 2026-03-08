import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { formatDate } from '@/core/utils/dates';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send, Activity, Sparkles, BarChart3, Users, Zap, TrendingUp } from 'lucide-react';

function QuotaRing({ used, cap }: { used: number; cap: number }) {
  const pct = Math.min(100, (used / cap) * 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 90 90" className="w-full h-full stat-ring">
        <circle cx="45" cy="45" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle cx="45" cy="45" r={r} fill="none" stroke="url(#quota-grad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ} animate={{ strokeDashoffset: offset }}
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
        <span className="text-[9px] text-muted-foreground/50">of {cap}</span>
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
  const recentHistory = myLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected').slice(0, 12);
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyUsed = myLeaves.filter(l =>
    ['Approved', 'PendingSupervisor'].includes(l.status) &&
    new Date(l.date).getMonth() === currentMonth && new Date(l.date).getFullYear() === currentYear
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = holidays.filter(h => h.date >= today).slice(0, 5);
  const teamPeers = useMemo(() => users.filter(u => u.role === 'agent' && u.departmentId === currentUser?.departmentId && u.id !== currentUser?.id).slice(0, 8), [users, currentUser]);
  const monthlyBreakdown = useMemo(() => {
    return [{ key: '01', label: 'Jan' }, { key: '02', label: 'Feb' }, { key: '03', label: 'Mar' }].map(m => {
      const mLeaves = myLeaves.filter(l => l.date.includes(`-${m.key}-`));
      return { month: m.label, total: mLeaves.length, approved: mLeaves.filter(l => l.status === 'Approved').length };
    });
  }, [myLeaves]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Agent Dashboard" title={`Welcome,`} highlight={currentUser?.name ?? ''}
        description={`${myDept?.name ?? 'Department'} • ${myLeaves.length} total requests • ${approved} approved this period`}
      />

      {/* KPI Row */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-7">
        <motion.div variants={staggerItem}><KpiCard label="Total Requests" value={myLeaves.length} icon={<FileText size={20} />} accent="primary" sparkline={monthlyBreakdown.map(m => m.total)} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${myLeaves.length > 0 ? Math.round((approved / myLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Swap / Transfer" value={swapTransfer} icon={<ArrowLeftRight size={20} />} accent="info" /></motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pending Requests */}
        <div className="lg:col-span-2 glass-card-featured overflow-hidden">
          <div className="px-6 py-4 border-b border-border/15 flex items-center justify-between bg-gradient-to-r from-warning/3 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/12">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-heading font-heading">Pending Requests</h2>
                <p className="text-[10px] text-muted-foreground">{pendingRequests.length} awaiting approval</p>
              </div>
            </div>
            <Link to="/agent/summary" className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1">View all <TrendingUp size={10} /></Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/6 flex items-center justify-center mx-auto mb-4 border border-success/10">
                <CheckCircle size={28} className="text-success/30" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No pending requests</p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {pendingRequests.slice(0, 10).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between px-6 py-3.5 table-row-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/8 flex items-center justify-center border border-warning/10">
                      <Calendar size={16} className="text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] bg-secondary/50 px-2 py-0.5 rounded-md font-medium border border-border/15">{l.type}</span>
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

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Monthly Quota */}
          <div className="glass-card gradient-border p-6">
            <h2 className="text-xs font-bold tracking-heading mb-4 flex items-center gap-2 font-heading">
              <Activity size={14} className="text-primary" /> Monthly Quota
            </h2>
            <div className="flex items-center gap-5">
              <QuotaRing used={monthlyUsed} cap={rules.agentMonthlyLeaveCap} />
              <div className="space-y-2.5 text-xs flex-1">
                {[
                  { label: 'Used', value: monthlyUsed, color: 'text-foreground', bg: 'bg-primary/6' },
                  { label: 'Remaining', value: Math.max(0, rules.agentMonthlyLeaveCap - monthlyUsed), color: 'text-success', bg: 'bg-success/6' },
                  { label: 'Cap', value: `${rules.agentMonthlyLeaveCap}/mo`, color: 'text-muted-foreground', bg: 'bg-secondary/30' },
                ].map(s => (
                  <div key={s.label} className={`flex items-center justify-between ${s.bg} rounded-lg px-3 py-1.5 border border-border/10`}>
                    <span className="text-muted-foreground/60 text-[10px]">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card accent-top-card p-6">
            <h2 className="text-xs font-bold tracking-heading mb-4 font-heading flex items-center gap-2">
              <Zap size={13} className="text-accent" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/agent/leave" className="w-full btn-primary-gradient text-primary-foreground font-bold px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs justify-center"><Send size={14} /> Apply for Leave</Link>
              <Link to="/agent/summary" className="w-full bg-card/80 border border-border/40 text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs justify-center hover:bg-card hover:border-border/60 transition-all"><FileText size={14} /> View Summary</Link>
              <Link to="/agent/requests" className="w-full bg-card/80 border border-border/40 text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs justify-center hover:bg-card hover:border-border/60 transition-all"><ArrowLeftRight size={14} /> Swap / Transfer</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-bold tracking-heading mb-5 font-heading flex items-center gap-2">
            <BarChart3 size={15} className="text-info" /> Recent Activity
          </h2>
          {recentHistory.length === 0 ? (
            <div className="py-10 text-center">
              <Sparkles size={28} className="mx-auto mb-3 text-muted-foreground/15" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/20 via-accent/15 to-transparent" />
              <div className="space-y-4">
                {recentHistory.map((l, i) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-start gap-4 relative">
                    <div className={`w-[10px] h-[10px] rounded-full mt-2 flex-shrink-0 relative z-10 ring-3 ring-background ${l.status === 'Approved' ? 'bg-success shadow-[0_0_8px_hsla(152,69%,42%,0.4)]' : 'bg-destructive shadow-[0_0_8px_hsla(0,85%,60%,0.4)]'}`} />
                    <div className="flex-1 flex items-center justify-between min-w-0 p-3 rounded-xl bg-card/40 border border-border/15 hover:border-border/30 transition-colors">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{l.type}</span>
                      </div>
                      <StatusChip status={l.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Holidays + Team */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-3 font-heading flex items-center gap-2">
              <Calendar size={13} className="text-accent" /> Upcoming Holidays
            </h2>
            {upcomingHolidays.length === 0 ? <p className="text-xs text-muted-foreground/40 text-center py-4">None upcoming</p> : (
              <div className="space-y-2">
                {upcomingHolidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/15 hover:border-accent/20 transition-colors group">
                    <div>
                      <span className="text-xs font-semibold group-hover:text-accent transition-colors">{h.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{formatDate(h.date)}</span>
                    </div>
                    <span className="text-[8px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/12">{h.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-3 font-heading flex items-center gap-2">
              <Users size={13} className="text-info" /> Team Members
            </h2>
            <div className="space-y-2">
              {teamPeers.map(peer => {
                const peerLeaves = leaves.filter(l => l.requesterId === peer.id && l.status === 'Approved').length;
                return (
                  <div key={peer.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-card/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center text-[8px] font-bold text-primary border border-primary/8">
                        {peer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[110px]">{peer.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-md">{peerLeaves} leaves</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
