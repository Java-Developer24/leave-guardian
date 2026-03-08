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
import { TrendingUp, CheckSquare, AlertTriangle, BarChart3, Users, Clock, Calendar, Gauge } from 'lucide-react';

function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 stat-ring">
      <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
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
        tag="SUPERVISOR DASHBOARD"
        title="Team"
        highlight="Overview"
        description="Monitor your team's leave activity, shrinkage metrics, and pending approvals at a glance."
        action={
          <Link to="/supervisor/approvals" className="btn-primary-gradient text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <CheckSquare size={15} /> Review Approvals
          </Link>
        }
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={20} />} accent="success" trend={{ value: 'This month', direction: 'up' }} sparkline={[65, 72, 80, 78, 85, 87]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Current Shrinkage" value={`${currentShrinkage.toFixed(1)}%`} icon={<Gauge size={20} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} subtitle={`Cap: ${rules.maxDailyPct}%`} sparkline={[5, 7, 8, 6, 9, 7]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending Approvals" value={pending.length} icon={<Clock size={20} />} accent="warning" trend={pending.length > 3 ? { value: 'Urgent', direction: 'up' } : undefined} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Size" value={teamSize} icon={<Users size={20} />} accent="accent" subtitle="Active agents" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-heading">Pending Approvals</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Requires your action</p>
            </div>
            <Link to="/supervisor/approvals" className="text-xs text-primary font-semibold hover:underline">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare size={36} className="mx-auto mb-3 text-success/25" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {pending.slice(0, 6).map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 flex items-center justify-between table-row-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {getInitials(l.requesterId)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{getUserName(l.requesterId)}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Approval Rate Ring */}
          <div className="glass-card gradient-border p-5 text-center">
            <h3 className="text-sm font-bold tracking-heading mb-3">Approval Rate</h3>
            <div className="flex justify-center mb-2">
              <div className="relative">
                <MiniDonut pct={approvalRate} color="hsl(142, 76%, 36%)" />
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(90deg)' }}>
                  <span className="text-lg font-extrabold">{approvalRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{approvedCount} approved / {totalDecided} decided</p>
          </div>

          {/* High-risk dates */}
          <div className="glass-card accent-top-card p-5">
            <h2 className="text-sm font-bold tracking-heading mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-warning" />
              High-Risk Dates
            </h2>
            {upcomingDates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No high-risk dates</p>
            ) : (
              <div className="space-y-2">
                {upcomingDates.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/20">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-warning" />
                      <span className="text-xs font-medium">{formatDate(date)}</span>
                    </div>
                    <span className="text-[10px] bg-warning/12 text-warning px-2 py-0.5 rounded-full font-bold">{count} req</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentShrinkage > rules.maxDailyPct * 0.7 && (
            <div className="glass-card p-4 animate-border-glow flex items-start gap-3">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold">Shrinkage Alert</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">At {currentShrinkage.toFixed(1)}%, approaching {rules.maxDailyPct}% cap.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
