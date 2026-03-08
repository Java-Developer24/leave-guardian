import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { toDateStr, formatDate } from '@/core/utils/dates';
import { TrendingUp, CheckSquare, AlertTriangle, Users, Clock, Calendar, Gauge, Shield, Zap, Target } from 'lucide-react';

function MiniDonut({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full stat-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-extrabold font-heading">{pct}%</span>
      </div>
    </div>
  );
}

export default function SupervisorHome() {
  const { leaves, schedule, rules, currentUser, users } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';

  const deptLeaves = leaves.filter(l => l.departmentId === deptId);
  const approvedCount = deptLeaves.filter(l => l.status === 'Approved').length;
  const totalDecided = deptLeaves.filter(l => ['Approved', 'Rejected'].includes(l.status)).length;
  const approvalRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0;

  const todayStr = toDateStr(new Date());
  const currentShrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);
  const pending = deptLeaves.filter(l => l.status === 'PendingSupervisor');
  const teamSize = users.filter(u => u.role === 'agent' && u.departmentId === deptId).length;
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const upcomingDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    pending.forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
    return Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).slice(0, 5);
  }, [pending]);

  const topAgents = useMemo(() => {
    const agentMap: Record<string, number> = {};
    deptLeaves.filter(l => l.status === 'Approved').forEach(l => { agentMap[l.requesterId] = (agentMap[l.requesterId] || 0) + 1; });
    return Object.entries(agentMap).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [deptLeaves]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Supervisor Dashboard" title="Team" highlight="Overview"
        description="Monitor leave activity, shrinkage levels, and pending approvals for your department."
        action={<Link to="/supervisor/approvals" className="btn-primary-gradient text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"><CheckSquare size={15} /> Review Approvals</Link>}
      />

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={20} />} accent="success" sparkline={[65, 72, 80, 78, 85, 87]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Today's Shrinkage" value={`${currentShrinkage.toFixed(1)}%`} icon={<Gauge size={20} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} subtitle={`Cap: ${rules.maxDailyPct}%`} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending Queue" value={pending.length} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Size" value={teamSize} icon={<Users size={20} />} accent="accent" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 glass-card-featured overflow-hidden">
          <div className="px-6 py-4 border-b border-border/15 flex items-center justify-between bg-gradient-to-r from-warning/3 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/12">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-heading font-heading">Pending Approvals</h2>
                <p className="text-[10px] text-muted-foreground">{pending.length} requests need your action</p>
              </div>
            </div>
            <Link to="/supervisor/approvals" className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/6 flex items-center justify-center mx-auto mb-4 border border-success/10">
                <CheckSquare size={28} className="text-success/30" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">All caught up!</p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {pending.slice(0, 7).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="px-6 py-3.5 flex items-center justify-between table-row-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/12 to-accent/6 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                      {getInitials(l.requesterId)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Approval Donut */}
          <div className="glass-card gradient-border p-6 text-center">
            <h3 className="text-xs font-bold tracking-heading mb-4 font-heading flex items-center justify-center gap-2">
              <Target size={13} className="text-success" /> Approval Rate
            </h3>
            <div className="flex justify-center mb-3">
              <MiniDonut pct={approvalRate} color="hsl(152, 69%, 42%)" />
            </div>
            <p className="text-xs text-muted-foreground">{approvedCount} approved / {totalDecided} decided</p>
          </div>

          {/* Risk Dates */}
          <div className="glass-card accent-top-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-4 flex items-center gap-2 font-heading">
              <AlertTriangle size={13} className="text-warning" /> Risk Dates
            </h2>
            {upcomingDates.length === 0 ? <p className="text-xs text-muted-foreground/40 text-center py-3">No risk dates</p> : (
              <div className="space-y-2">
                {upcomingDates.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/15 hover:border-warning/20 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Calendar size={13} className="text-warning" />
                      <span className="text-xs font-medium">{formatDate(date)}</span>
                    </div>
                    <span className="text-[10px] bg-warning/10 text-warning px-2.5 py-1 rounded-full font-bold border border-warning/12">{count} reqs</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Leave Takers */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-bold tracking-heading mb-3 flex items-center gap-2 font-heading">
              <Zap size={13} className="text-accent" /> Top Leave Takers
            </h2>
            <div className="space-y-2">
              {topAgents.map(([id, count], i) => (
                <div key={id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-bold text-muted-foreground/30 w-4">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center text-[8px] font-bold text-primary border border-primary/8">
                      {getInitials(id)}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[100px]">{getUserName(id)}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground bg-secondary/30 px-2.5 py-0.5 rounded-md">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shrinkage Alert */}
          {currentShrinkage > rules.maxDailyPct * 0.7 && (
            <div className="glass-card p-4 animate-border-glow flex items-start gap-3 bg-gradient-to-r from-warning/4 to-transparent">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/12 flex-shrink-0">
                <Shield size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold">Shrinkage Alert</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentShrinkage.toFixed(1)}% / {rules.maxDailyPct}% cap — approaching threshold</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
