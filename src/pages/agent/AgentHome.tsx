import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { formatDate } from '@/core/utils/dates';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send, Activity, Sparkles, BarChart3, Users } from 'lucide-react';

function QuotaRing({ used, cap }: { used: number; cap: number }) {
  const pct = Math.min(100, (used / cap) * 100);
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full stat-ring">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle cx="40" cy="40" r={r} fill="none" stroke="url(#quota-grad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <defs>
          <linearGradient id="quota-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(354, 100%, 64%)" />
            <stop offset="100%" stopColor="hsl(35, 100%, 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold font-heading">{used}</span>
        <span className="text-[8px] text-muted-foreground">of {cap}</span>
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
  const recentHistory = myLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected').slice(0, 5);
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyUsed = myLeaves.filter(l =>
    ['Approved', 'PendingSupervisor'].includes(l.status) &&
    new Date(l.date).getMonth() === currentMonth && new Date(l.date).getFullYear() === currentYear
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = holidays.filter(h => h.date >= today).slice(0, 3);
  const teamPeers = useMemo(() => users.filter(u => u.role === 'agent' && u.departmentId === currentUser?.departmentId && u.id !== currentUser?.id).slice(0, 5), [users, currentUser]);
  const monthlyBreakdown = useMemo(() => {
    return [{ key: '01', label: 'Jan' }, { key: '02', label: 'Feb' }, { key: '03', label: 'Mar' }].map(m => {
      const mLeaves = myLeaves.filter(l => l.date.includes(`-${m.key}-`));
      return { month: m.label, total: mLeaves.length, approved: mLeaves.filter(l => l.status === 'Approved').length };
    });
  }, [myLeaves]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Agent Dashboard" title={`Welcome,`} highlight={currentUser?.name ?? ''}
        description={`${myDept?.name ?? 'Department'} • ${myLeaves.length} requests • ${approved} approved`}
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-5 gap-2.5 mb-4">
        <motion.div variants={staggerItem}><KpiCard label="Total" value={myLeaves.length} icon={<FileText size={16} />} accent="primary" sparkline={monthlyBreakdown.map(m => m.total)} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={16} />} accent="success" trend={{ value: `${myLeaves.length > 0 ? Math.round((approved / myLeaves.length) * 100) : 0}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={16} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={16} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Swap/Xfer" value={swapTransfer} icon={<ArrowLeftRight size={16} />} accent="info" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Pending */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/15 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold tracking-heading font-heading">Pending Requests</h2>
              <p className="text-[9px] text-muted-foreground">{pendingRequests.length} awaiting</p>
            </div>
            <Link to="/agent/summary" className="text-[9px] text-primary font-bold hover:underline">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle size={28} className="mx-auto mb-2 text-success/20" />
              <p className="text-xs text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {pendingRequests.slice(0, 5).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-4 py-2.5 table-row-hover"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-warning/8 flex items-center justify-center border border-warning/10">
                      <Calendar size={13} className="text-warning" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold">{formatDate(l.date)}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] bg-secondary/50 px-1.5 py-0.5 rounded font-medium border border-border/15">{l.type}</span>
                        {l.peerId && <span className="text-[8px] text-muted-foreground">with {getUserName(l.peerId)}</span>}
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
        <div className="space-y-3">
          <div className="glass-card gradient-border p-4">
            <h2 className="text-[10px] font-bold tracking-heading mb-3 flex items-center gap-1.5 font-heading">
              <Activity size={12} className="text-primary" /> Monthly Quota
            </h2>
            <div className="flex items-center gap-4">
              <QuotaRing used={monthlyUsed} cap={rules.agentMonthlyLeaveCap} />
              <div className="space-y-1.5 text-[10px] flex-1">
                {[
                  { label: 'Used', value: monthlyUsed, color: 'text-foreground' },
                  { label: 'Left', value: Math.max(0, rules.agentMonthlyLeaveCap - monthlyUsed), color: 'text-success' },
                  { label: 'Cap', value: `${rules.agentMonthlyLeaveCap}/mo`, color: 'text-muted-foreground' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground/50 text-[9px]">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card accent-top-card p-4">
            <h2 className="text-[10px] font-bold tracking-heading mb-2.5 font-heading flex items-center gap-1.5">
              <Sparkles size={11} className="text-accent" /> Quick Actions
            </h2>
            <div className="space-y-1.5">
              <Link to="/agent/leave" className="w-full btn-primary-gradient text-primary-foreground font-bold px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] justify-center"><Send size={12} /> Apply Leave</Link>
              <Link to="/agent/summary" className="w-full bg-secondary/30 border border-border/30 text-foreground font-medium px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] justify-center hover:bg-secondary/50 transition-all"><FileText size={12} /> Summary</Link>
              <Link to="/agent/requests" className="w-full bg-secondary/30 border border-border/30 text-foreground font-medium px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] justify-center hover:bg-secondary/50 transition-all"><ArrowLeftRight size={12} /> Swap</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 glass-card p-4">
          <h2 className="text-[10px] font-bold tracking-heading mb-3 font-heading flex items-center gap-1.5">
            <BarChart3 size={12} className="text-info" /> Recent Activity
          </h2>
          {recentHistory.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/40 text-center py-4">No activity yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[13px] top-1 bottom-1 w-px bg-gradient-to-b from-border/30 to-transparent" />
              <div className="space-y-2.5">
                {recentHistory.map((l, i) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-start gap-3 relative">
                    <div className={`w-[7px] h-[7px] rounded-full mt-1.5 flex-shrink-0 relative z-10 ring-2 ring-background ${l.status === 'Approved' ? 'bg-success' : 'bg-destructive'}`} />
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold">{formatDate(l.date)}</span>
                        <span className="text-[9px] text-muted-foreground ml-1.5">{l.type}</span>
                      </div>
                      <StatusChip status={l.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="glass-card p-4">
            <h2 className="text-[10px] font-bold tracking-heading mb-2 font-heading flex items-center gap-1.5">
              <Calendar size={11} className="text-accent" /> Holidays
            </h2>
            {upcomingHolidays.length === 0 ? <p className="text-[9px] text-muted-foreground/40">None upcoming</p> : (
              <div className="space-y-1.5">
                {upcomingHolidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/10">
                    <div>
                      <span className="text-[9px] font-semibold">{h.name}</span>
                      <span className="text-[8px] text-muted-foreground ml-1.5">{formatDate(h.date)}</span>
                    </div>
                    <span className="text-[7px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold border border-accent/12">{h.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass-card p-4">
            <h2 className="text-[10px] font-bold tracking-heading mb-2 font-heading flex items-center gap-1.5">
              <Users size={11} className="text-info" /> Team
            </h2>
            <div className="space-y-1.5">
              {teamPeers.map(peer => {
                const peerLeaves = leaves.filter(l => l.requesterId === peer.id && l.status === 'Approved').length;
                return (
                  <div key={peer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/8 flex items-center justify-center text-[7px] font-bold text-primary border border-primary/8">
                        {peer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[9px] font-medium truncate max-w-[90px]">{peer.name}</span>
                    </div>
                    <span className="text-[8px] text-muted-foreground">{peerLeaves} leaves</span>
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
