import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { toDateStr } from '@/core/utils/dates';
import { TrendingUp, CheckSquare, AlertTriangle, BarChart3 } from 'lucide-react';

export default function SupervisorHome() {
  const { leaves, schedule, rules, currentUser } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';

  const deptLeaves = leaves.filter(l => l.departmentId === deptId);
  const approvedCount = deptLeaves.filter(l => l.status === 'Approved').length;
  const totalDecided = deptLeaves.filter(l => ['Approved', 'Rejected'].includes(l.status)).length;
  const approvalRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0;

  const todayStr = toDateStr(new Date());
  const currentShrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);

  const pending = deptLeaves.filter(l => l.status === 'PendingSupervisor').slice(0, 5);

  return (
    <motion.div {...pageTransition}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-heading">Supervisor Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Department overview</p>
      </div>

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={18} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Current Shrinkage" value={`${currentShrinkage.toFixed(1)}%`} icon={<BarChart3 size={18} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending Approvals" value={pending.length} icon={<CheckSquare size={18} />} accent="warning" /></motion.div>
      </motion.div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-heading">Pending Approvals</h2>
          <Link to="/supervisor/approvals" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending approvals</p>
        ) : (
          <div className="space-y-3">
            {pending.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border">
                <div>
                  <span className="text-sm font-medium">{l.date}</span>
                  <span className="text-xs text-muted-foreground ml-2">{l.type}</span>
                </div>
                <StatusChip status={l.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {currentShrinkage > rules.maxDailyPct * 0.8 && (
        <div className="glass-card p-4 border-warning/30 bg-warning/5 flex items-center gap-3">
          <AlertTriangle className="text-warning flex-shrink-0" size={20} />
          <p className="text-sm">Shrinkage approaching daily cap ({rules.maxDailyPct}%). Review upcoming approvals carefully.</p>
        </div>
      )}
    </motion.div>
  );
}
