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
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg viewBox="0 0 72 72" className="w-16 h-16 stat-ring">
      <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
      <motion.circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
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
    return Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).slice(0, 5);
  }, [pending]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Supervisor Dashboard"
        title="Team"
        highlight="Overview"
        description="Monitor your team's leave activity, shrinkage metrics, and pending approvals."
        action={
          <Link to="/supervisor/approvals" className="btn-primary-gradient text-primary-foreground font-bold px-6 py-3 rounded-2xl text-sm flex items-center gap-2.5">
            <CheckSquare size={15} /> Review Approvals
          </Link>
        }
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={22} />} accent="success" trend={{ value: 'This month', direction: 'up' }} sparkline={[65, 72, 80, 78, 85, 87]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Current Shrinkage" value={`${currentShrinkage.toFixed(1)}%`} icon={<Gauge size={22} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} subtitle={`Cap: ${rules.maxDailyPct}%`} sparkline={[5, 7, 8, 6, 9, 7]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending Approvals" value={pending.length} icon={<Clock size={22} />} accent="warning" trend={pending.length > 3 ? { value: 'Urgent', direction: 'up' } : undefined} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Size" value={teamSize} icon={<Users size={22} />} accent="accent" subtitle="Active agents" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-6 border-b border-border/20 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-heading font-heading">Pending Approvals</h2>
              <p className="text-[11px] text-muted-foreground mt-1">Requires your action</p>
            </div>
            <Link to="/supervisor/approvals" className="text-xs text-primary font-semibold hover:underline">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="py-16 text-center">
              <CheckSquare size={40} className="mx-auto mb-4 text-success/20" />
              <p className="text-sm text-muted-foreground font-medium">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/15">
              {pending.slice(0, 6).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="p-5 flex items-center justify-between table-row-hover">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/8">
                      {getInitials(l.requesterId)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="glass-card gradient-border p-6 text-center">
            <h3 className="text-sm font-bold tracking-heading mb-4 font-heading">Approval Rate</h3>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <MiniDonut pct={approvalRate} color="hsl(152, 69%, 42%)" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-extrabold font-heading">{approvalRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{approvedCount} approved / {totalDecided} decided</p>
          </div>

          <div className="glass-card accent-top-card p-6">
            <h2 className="text-sm font-bold tracking-heading mb-4 flex items-center gap-2 font-heading">
              <AlertTriangle size={14} className="text-warning" />
              High-Risk Dates
            </h2>
            {upcomingDates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No high-risk dates</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDates.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/25 border border-border/15">
                    <div className="flex items-center gap-2.5">
                      <Calendar size={13} className="text-warning" />
                      <span className="text-xs font-medium">{formatDate(date)}</span>
                    </div>
                    <span className="text-[10px] bg-warning/10 text-warning px-2.5 py-0.5 rounded-full font-bold border border-warning/12">{count} req</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentShrinkage > rules.maxDailyPct * 0.7 && (
            <div className="glass-card p-5 animate-border-glow flex items-start gap-3">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold">Shrinkage Alert</p>
                <p className="text-[11px] text-muted-foreground mt-1">At {currentShrinkage.toFixed(1)}%, approaching {rules.maxDailyPct}% cap.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
