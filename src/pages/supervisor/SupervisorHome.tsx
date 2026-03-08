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
import { TrendingUp, CheckSquare, AlertTriangle, Users, Clock, Calendar, Gauge } from 'lucide-react';

function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg viewBox="0 0 60 60" className="w-14 h-14 stat-ring">
      <circle cx="30" cy="30" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
      <motion.circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </svg>
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
    return Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).slice(0, 4);
  }, [pending]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Supervisor Dashboard" title="Team" highlight="Overview"
        description="Monitor leave activity, shrinkage, and pending approvals."
        action={<Link to="/supervisor/approvals" className="btn-primary-gradient text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"><CheckSquare size={13} /> Review</Link>}
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-4 gap-2.5 mb-4">
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={16} />} accent="success" sparkline={[65, 72, 80, 78, 85, 87]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Shrinkage" value={`${currentShrinkage.toFixed(1)}%`} icon={<Gauge size={16} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} subtitle={`Cap: ${rules.maxDailyPct}%`} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending.length} icon={<Clock size={16} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Size" value={teamSize} icon={<Users size={16} />} accent="accent" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/15 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold tracking-heading font-heading">Pending Approvals</h2>
              <p className="text-[9px] text-muted-foreground">Requires your action</p>
            </div>
            <Link to="/supervisor/approvals" className="text-[9px] text-primary font-semibold hover:underline">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="py-10 text-center">
              <CheckSquare size={32} className="mx-auto mb-3 text-success/20" />
              <p className="text-xs text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {pending.slice(0, 6).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="px-4 py-2.5 flex items-center justify-between table-row-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary border border-primary/8">
                      {getInitials(l.requesterId)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[9px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="glass-card gradient-border p-4 text-center">
            <h3 className="text-[10px] font-bold tracking-heading mb-2 font-heading">Approval Rate</h3>
            <div className="flex justify-center mb-2">
              <div className="relative">
                <MiniDonut pct={approvalRate} color="hsl(152, 69%, 42%)" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-extrabold font-heading">{approvalRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground">{approvedCount} / {totalDecided} decided</p>
          </div>

          <div className="glass-card accent-top-card p-4">
            <h2 className="text-[10px] font-bold tracking-heading mb-3 flex items-center gap-1.5 font-heading">
              <AlertTriangle size={12} className="text-warning" /> Risk Dates
            </h2>
            {upcomingDates.length === 0 ? <p className="text-[9px] text-muted-foreground">No risk dates</p> : (
              <div className="space-y-1.5">
                {upcomingDates.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between p-2 rounded-lg bg-secondary/25 border border-border/10">
                    <div className="flex items-center gap-2">
                      <Calendar size={11} className="text-warning" />
                      <span className="text-[10px] font-medium">{formatDate(date)}</span>
                    </div>
                    <span className="text-[9px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-bold border border-warning/12">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentShrinkage > rules.maxDailyPct * 0.7 && (
            <div className="glass-card p-3 animate-border-glow flex items-start gap-2.5">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-xs font-semibold">Shrinkage Alert</p>
                <p className="text-[9px] text-muted-foreground">{currentShrinkage.toFixed(1)}% / {rules.maxDailyPct}% cap</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
