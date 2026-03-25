import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { toDateStr } from '@/core/utils/dates';
import { Target, Gauge, Calendar, AlertTriangle, TrendingUp, Shield, CheckCircle, Eye, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SupervisorAnalytics() {
  const { leaves, schedule, rules, currentUser, users, departments } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';
  const myDept = departments.find(d => d.id === deptId);

  const deptLeaves = leaves.filter(l => l.departmentId === deptId);
  const teamAgents = users.filter(u => u.role === 'agent' && u.departmentId === deptId);
  const teamSize = teamAgents.length;
  const todayStr = toDateStr(new Date());
  const currentShrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);

  const totalWorkHrs = teamSize * 8;
  const currentWorkHrs = Math.round(totalWorkHrs * (1 - currentShrinkage / 100));
  const plannedLeaves = deptLeaves.filter(l => l.type === 'Planned').length;
  const pendingApprovals = deptLeaves.filter(l => l.status === 'PendingSupervisor').length;

  // Risk dates
  const riskDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    deptLeaves.filter(l => ['Approved', 'PendingSupervisor'].includes(l.status)).forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
    return Object.entries(dateMap).sort(([, a], [, b]) => b - a).slice(0, 5).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      count,
      severity: count >= 4 ? 'High' : count >= 2 ? 'Moderate' : 'Low',
      desc: `${count} team members requested leave`,
    }));
  }, [deptLeaves]);
  const highRiskCount = riskDates.filter(d => d.severity === 'High').length;

  // Planned vs Actual (monthly)
  const attendanceTrend = useMemo(() => {
    const months = [
      { key: '2025-10', label: 'October', planned: teamSize * 22, actual: 0 },
      { key: '2025-11', label: 'November', planned: teamSize * 20, actual: 0 },
      { key: '2025-12', label: 'December', planned: teamSize * 21, actual: 0 },
      { key: '2026-01', label: 'January', planned: teamSize * 22, actual: 0 },
      { key: '2026-02', label: 'February', planned: teamSize * 20, actual: 0 },
    ];
    months.forEach(m => {
      const mLeaves = deptLeaves.filter(l => l.date.startsWith(m.key) && l.status === 'Approved').length;
      m.actual = m.planned - mLeaves;
    });
    return months;
  }, [deptLeaves, teamSize]);

  // Shrinkage forecast
  const shrinkageForecast = useMemo(() => {
    return [
      { month: 'January', pct: 6.2, target: 8 },
      { month: 'February', pct: 7.8, target: 8 },
      { month: 'March', pct: 9.1, target: 8 },
    ];
  }, []);

  const teamRisk = useMemo(() => {
    return teamAgents.map(agent => {
      const agentLeaves = deptLeaves.filter(leave => leave.requesterId === agent.id);
      const approved = agentLeaves.filter(leave => leave.status === 'Approved').length;
      const pending = agentLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status)).length;
      const scheduledDays = schedule.filter(item => item.userId === agent.id && !item.weekOff).length;
      const impact = scheduledDays === 0 ? 0 : Number((((approved + pending) / scheduledDays) * 100).toFixed(1));
      return {
        id: agent.id,
        name: agent.name,
        approved,
        pending,
        impact,
        risk: impact > 15 ? 'High' : impact > 8 ? 'Moderate' : 'Low',
      };
    }).sort((a, b) => b.impact - a.impact).slice(0, 6);
  }, [teamAgents, deptLeaves, schedule]);

  // Recommendations
  const recommendations = [
    { title: 'Redistribute high-risk days', desc: `${highRiskCount} high-risk date(s) need closer balancing inside ${myDept?.name ?? 'your department'}.`, severity: 'high' },
    { title: 'Prioritize pending approvals', desc: `${pendingApprovals} request(s) are still waiting in your queue and affect near-term coverage.`, severity: 'medium' },
    { title: 'Protect backup coverage', desc: 'Use week-off swaps and leave staggering only within your reporting team before escalating.', severity: 'low' },
  ];

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Supervisor Analytics" title="Performance" highlight="Analytics"
        description={`Current team and department insights for ${myDept?.name ?? 'your department'}`}
      />

      {/* KPIs */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Forecast Accuracy" value="94.3%" icon={<Target size={18} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Shrinkage %" value={`${currentShrinkage.toFixed(1)}%`} icon={<Gauge size={18} />} accent={currentShrinkage > rules.maxDailyPct ? 'primary' : 'info'} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Team Working Hours" value={`${currentWorkHrs}/${totalWorkHrs}`} icon={<Calendar size={18} />} accent="info" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="High Risk Days" value={highRiskCount} icon={<AlertTriangle size={18} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Planned Leaves" value={plannedLeaves} icon={<TrendingUp size={18} />} accent="primary" /></motion.div>
      </motion.div>

      {/* Row 1: Planned vs Actual + Shrinkage Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1">Planned vs Actual Attendance Trend</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Monthly comparison of planned vs actual headcount</p>
          <div className="space-y-3">
            {attendanceTrend.map(m => {
              const variance = m.actual - m.planned;
              const pct = m.planned > 0 ? Math.round((m.actual / m.planned) * 100) : 100;
              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold w-20">{m.label}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-muted-foreground">Planned: {m.planned}</span>
                      <span className="text-foreground font-semibold">Actual: {m.actual}</span>
                      <span className={`font-bold ${variance >= 0 ? 'text-success' : 'text-destructive'}`}>{variance >= 0 ? '+' : ''}{variance}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-5">
                    <div className="bg-primary/20 rounded-l-md h-full" style={{ width: `${pct}%` }} />
                    <div className="bg-primary rounded-r-md h-full" style={{ width: `${100 - pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1">Shrinkage % Forecast</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Monthly shrinkage with target line at {rules.maxDailyPct}%</p>
          <div className="space-y-4">
            {shrinkageForecast.map(m => (
              <div key={m.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{m.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.pct}%</span>
                    {m.pct > m.target && (
                      <span className="text-[9px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold border border-destructive/15">Over Target</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Progress value={(m.pct / 15) * 100} className="h-3" />
                  {/* Target line */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/40" style={{ left: `${(m.target / 15) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Shrinkage</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-foreground/40" /> Target ({rules.maxDailyPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: High Risk Dates + Team Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" /> High Risk Dates
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Dates with highest concurrent leave requests</p>
          <div className="space-y-2.5">
            {riskDates.map(d => (
              <div key={d.date} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-xs font-semibold">{d.date}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                </div>
                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold border ${d.severity === 'High' ? 'bg-destructive/10 text-destructive border-destructive/15' : d.severity === 'Moderate' ? 'bg-warning/10 text-warning border-warning/15' : 'bg-success/10 text-success border-success/15'}`}>
                  {d.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
            <Users size={14} className="text-info" /> Team Risk Analysis
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Only your reporting guides and department leave impact are shown here.</p>
          <div className="space-y-3">
            {teamRisk.map(item => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.impact}%</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${item.risk === 'High' ? 'bg-destructive/10 text-destructive border-destructive/15' : item.risk === 'Moderate' ? 'bg-warning/10 text-warning border-warning/15' : 'bg-success/10 text-success border-success/15'}`}>
                      {item.risk}
                    </span>
                  </div>
                </div>
                <Progress value={(item.impact / 20) * 100} className="h-2" />
                <div className="text-[10px] text-muted-foreground">
                  {item.approved} approved • {item.pending} pending
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Recommendations */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold font-heading mb-4 flex items-center gap-2">
          <Target size={14} className="text-primary" /> System Recommendations
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${rec.severity === 'high' ? 'bg-destructive' : rec.severity === 'medium' ? 'bg-warning' : 'bg-info'}`} />
                  <span className="text-xs font-bold">{rec.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-4">{rec.desc}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="text-[10px] bg-success/10 text-success px-3 py-1.5 rounded-lg font-bold border border-success/15 hover:bg-success/20 transition-colors flex items-center gap-1">
                  <CheckCircle size={10} /> Accept
                </button>
                <button className="text-[10px] bg-muted/40 text-muted-foreground px-3 py-1.5 rounded-lg font-bold border border-border hover:bg-muted/60 transition-colors flex items-center gap-1">
                  <Eye size={10} /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
