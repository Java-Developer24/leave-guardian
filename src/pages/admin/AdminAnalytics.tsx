import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { BarChart3, TrendingUp, Calendar, Users, Activity, PieChart } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', planned: 8, actual: 9, shrinkage: 7.2 },
  { month: 'Feb', planned: 10, actual: 12, shrinkage: 9.5 },
  { month: 'Mar', planned: 7, actual: 6, shrinkage: 5.8 },
  { month: 'Apr', planned: 9, actual: 11, shrinkage: 8.3 },
  { month: 'May', planned: 6, actual: 7, shrinkage: 6.1 },
  { month: 'Jun', planned: 11, actual: 13, shrinkage: 10.2 },
];

const riskDates = [
  { date: '2026-03-15', shrinkage: 9.2, requests: 4 },
  { date: '2026-03-22', shrinkage: 8.7, requests: 3 },
  { date: '2026-04-02', shrinkage: 11.5, requests: 5 },
  { date: '2026-04-15', shrinkage: 7.8, requests: 2 },
  { date: '2026-05-01', shrinkage: 14.2, requests: 6 },
];

const deptBreakdown = [
  { dept: 'Customer Care', leaves: 24, shrinkage: 8.4, agents: 5 },
  { dept: 'Technical Support', leaves: 18, shrinkage: 7.1, agents: 2 },
];

export default function AdminAnalytics() {
  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="ANALYTICS DASHBOARD"
        title="Performance"
        highlight="Insights"
        description="Deep-dive analytics across leave metrics, shrinkage trends, and departmental performance."
      />

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={51} icon={<Calendar size={20} />} accent="primary" trend={{ value: '+12%', direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value="87%" icon={<TrendingUp size={20} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Avg Shrinkage" value="7.9%" icon={<Activity size={20} />} accent="warning" trend={{ value: '-0.3%', direction: 'down' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Active Agents" value={7} icon={<Users size={20} />} accent="info" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="High Risk Days" value={5} icon={<BarChart3 size={20} />} accent="primary" trend={{ value: 'Next 60d', direction: 'neutral' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Departments" value={2} icon={<PieChart size={20} />} accent="accent" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Planned vs Actual Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold tracking-heading">Planned vs Actual Leaves</h3>
              <p className="text-xs text-muted-foreground mt-0.5">6-month comparison</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-primary" /> Planned</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-accent" /> Actual</span>
            </div>
          </div>
          <div className="space-y-3">
            {monthlyData.map(d => (
              <div key={d.month} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium w-8">{d.month}</span>
                  <span className="text-muted-foreground">P:{d.planned} A:{d.actual} | {d.shrinkage}%</span>
                </div>
                <div className="h-4 bg-secondary/30 rounded-full overflow-hidden flex relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.planned / 15) * 100}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
                    className="h-full bg-primary/50 rounded-l-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.max(0, d.actual - d.planned) / 15) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as const }}
                    className="h-full bg-accent/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Risk Dates */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h3 className="font-bold tracking-heading">High-Risk Dates</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Upcoming dates with shrinkage near or above cap</p>
          </div>
          <div className="space-y-2">
            {riskDates.map(d => {
              const pct = Math.min(100, (d.shrinkage / 15) * 100);
              const isOver = d.shrinkage > 10;
              return (
                <div key={d.date} className="p-3 bg-secondary/30 rounded-lg border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{d.date}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isOver ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
                        {d.shrinkage}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">{d.requests} req</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
                      className={`h-full rounded-full ${isOver ? 'bg-destructive/60' : 'bg-warning/60'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="font-bold tracking-heading">Department Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Leave and shrinkage metrics per department</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/20">
                {['Department', 'Agents', 'Total Leaves', 'Avg Shrinkage', 'Status'].map(h => (
                  <th key={h} className="text-left p-3.5 text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map(d => (
                <tr key={d.dept} className="border-t border-border/30 table-row-hover">
                  <td className="p-3.5 font-semibold">{d.dept}</td>
                  <td className="p-3.5">{d.agents}</td>
                  <td className="p-3.5">{d.leaves}</td>
                  <td className="p-3.5 font-semibold">{d.shrinkage}%</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${d.shrinkage > 8 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                      {d.shrinkage > 8 ? 'Watch' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
