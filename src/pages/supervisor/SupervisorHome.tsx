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
import { TrendingUp, CheckSquare, AlertTriangle, BarChart3, Users, Clock, Calendar } from 'lucide-react';

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

  // Upcoming high-risk dates (dates with multiple pending)
  const upcomingDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    pending.forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
    return Object.entries(dateMap)
      .filter(([, count]) => count >= 1)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5);
  }, [pending]);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="SUPERVISOR DASHBOARD"
        title="Team"
        highlight="Overview"
        description="Monitor your team's leave activity, shrinkage metrics, and pending approvals at a glance."
        action={
          <Link to="/supervisor/approvals" className="btn-primary-gradient text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <CheckSquare size={15} /> Review Approvals
          </Link>
        }
      />

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={20} />} accent="success" trend={{ value: 'This month', direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Current Shrinkage" value={`${currentShrinkage.toFixed(1)}%`} icon={<BarChart3 size={20} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} subtitle={`Cap: ${rules.maxDailyPct}%`} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending Approvals" value={pending.length} icon={<Clock size={20} />} accent="warning" trend={pending.length > 3 ? { value: 'Urgent', direction: 'up' } : undefined} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Size" value={teamSize} icon={<Users size={20} />} accent="accent" subtitle="Active agents" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-heading">Pending Approvals</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Requires your action</p>
            </div>
            <Link to="/supervisor/approvals" className="text-xs text-primary font-medium hover:underline">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="py-10 text-center">
              <CheckSquare size={32} className="mx-auto mb-2 text-success/30" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {pending.slice(0, 6).map(l => (
                <div key={l.id} className="p-4 flex items-center justify-between table-row-hover">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {getUserName(l.requesterId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{getUserName(l.requesterId)}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDate(l.date)} • {l.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip status={l.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-risk dates & alerts */}
        <div className="space-y-4">
          <div className="glass-card accent-top-card p-5">
            <h2 className="text-base font-bold tracking-heading mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              High-Risk Dates
            </h2>
            {upcomingDates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No high-risk dates identified</p>
            ) : (
              <div className="space-y-2">
                {upcomingDates.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-warning" />
                      <span className="text-xs font-medium">{formatDate(date)}</span>
                    </div>
                    <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full font-semibold">{count} request{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentShrinkage > rules.maxDailyPct * 0.7 && (
            <div className="glass-card p-4 border-warning/20 flex items-start gap-3">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium">Shrinkage Alert</p>
                <p className="text-xs text-muted-foreground mt-0.5">Current shrinkage is at {currentShrinkage.toFixed(1)}%, approaching the daily cap of {rules.maxDailyPct}%. Review upcoming approvals carefully.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
