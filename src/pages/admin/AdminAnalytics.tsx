import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Users, Activity, Search, Filter, Building2, Clock, CheckCircle, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Target, Zap, Gauge, Shield, Eye } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell, ComposedChart, Line, Area,
  Treemap
} from 'recharts';

const tooltipStyle = {
  background: 'hsl(25, 60%, 97%)',
  border: '1px solid hsl(25, 22%, 88%)',
  borderRadius: 12,
  fontSize: 11,
  padding: '8px 12px',
};

const DEPT_COLORS = [
  'hsl(356, 98%, 65%)', 'hsl(37, 100%, 58%)', 'hsl(215, 100%, 58%)',
  'hsl(152, 69%, 42%)', 'hsl(280, 80%, 60%)', 'hsl(190, 90%, 50%)',
  'hsl(45, 100%, 50%)', 'hsl(320, 80%, 55%)', 'hsl(160, 60%, 45%)',
  'hsl(10, 90%, 55%)', 'hsl(240, 60%, 60%)',
];

const STATUS_COLORS: Record<string, string> = {
  Approved: 'hsl(152, 69%, 42%)',
  Rejected: 'hsl(0, 85%, 60%)',
  PendingSupervisor: 'hsl(37, 100%, 58%)',
  PendingPeer: 'hsl(215, 100%, 58%)',
};

function TreemapContent(props: any) {
  const { x, y, width, height, name, value, index } = props;
  if (width < 8 || height < 8) return null;
  const color = DEPT_COLORS[index % DEPT_COLORS.length];
  const shortName = name?.replace('Messaging - ', 'M-').replace('Messaging ', 'M-');
  return (
    <g>
      <rect x={x + 2} y={y + 2} width={width - 4} height={height - 4} rx={8} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
      {width > 50 && height > 40 && (
        <>
          <text x={x + 8} y={y + 22} fontSize={11} fontWeight={700} fill="hsl(120,7%,9%)" fontFamily="Funnel Sans">
            {shortName && shortName.length > Math.floor(width / 8) ? shortName.slice(0, Math.floor(width / 8)) + '…' : shortName}
          </text>
          <text x={x + 8} y={y + 36} fontSize={10} fontWeight={600} fill={color} fontFamily="Funnel Sans">{value} leaves</text>
        </>
      )}
    </g>
  );
}

export default function AdminAnalytics() {
  const { users, leaves, departments, rules } = useAppStore();
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'all' | 'jan' | 'feb' | 'mar'>('all');

  const timeFilteredLeaves = useMemo(() => {
    if (timeRange === 'all') return leaves;
    const monthMap = { jan: '01', feb: '02', mar: '03' };
    return leaves.filter(l => l.date.startsWith(`2026-${monthMap[timeRange]}`));
  }, [leaves, timeRange]);

  const filteredLeaves = deptFilter === 'all' ? timeFilteredLeaves : timeFilteredLeaves.filter(l => l.departmentId === deptFilter);
  const totalAgents = users.filter(u => u.role === 'agent' && (deptFilter === 'all' || u.departmentId === deptFilter)).length;
  const totalLeaves = filteredLeaves.length;
  const approved = filteredLeaves.filter(l => l.status === 'Approved').length;
  const rejected = filteredLeaves.filter(l => l.status === 'Rejected').length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
  const pendingCount = filteredLeaves.filter(l => l.status === 'PendingSupervisor').length;
  const peerPending = filteredLeaves.filter(l => l.status === 'PendingPeer').length;

  const deptBreakdown = useMemo(() => {
    return departments
      .filter(dept => {
        if (deptFilter !== 'all' && dept.id !== deptFilter) return false;
        if (searchTerm && !dept.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .map(dept => {
        const agents = users.filter(u => u.role === 'agent' && u.departmentId === dept.id).length;
        const dl = timeFilteredLeaves.filter(l => l.departmentId === dept.id);
        const da = dl.filter(l => l.status === 'Approved').length;
        const dr = dl.filter(l => l.status === 'Rejected').length;
        const dp = dl.filter(l => l.status === 'PendingSupervisor').length;
        const avg = agents > 0 ? parseFloat((dl.length / agents).toFixed(1)) : 0;
        const shrinkage = agents > 0 ? parseFloat(((da / Math.max(1, agents * 20)) * 100).toFixed(1)) : 0;
        return { id: dept.id, dept: dept.name, agents, leaves: dl.length, approved: da, rejected: dr, pending: dp, avgPerAgent: avg, shrinkage };
      }).sort((a, b) => b.agents - a.agents);
  }, [departments, users, timeFilteredLeaves, deptFilter, searchTerm]);

  const statusData = useMemo(() => [
    { name: 'Approved', value: approved, fill: STATUS_COLORS.Approved },
    { name: 'Rejected', value: rejected, fill: STATUS_COLORS.Rejected },
    { name: 'Pending', value: pendingCount, fill: STATUS_COLORS.PendingSupervisor },
    { name: 'Peer Pending', value: peerPending, fill: STATUS_COLORS.PendingPeer },
  ].filter(d => d.value > 0), [approved, rejected, pendingCount, peerPending]);

  const treemapData = useMemo(() => deptBreakdown.map(d => ({ name: d.dept, size: d.leaves })), [deptBreakdown]);

  const monthlyTrend = useMemo(() => {
    return [{ key: '2026-01', label: 'Jan' }, { key: '2026-02', label: 'Feb' }, { key: '2026-03', label: 'Mar' }].map(m => {
      const ml = leaves.filter(l => l.date.startsWith(m.key));
      return { month: m.label, total: ml.length, approved: ml.filter(l => l.status === 'Approved').length, rejected: ml.filter(l => l.status === 'Rejected').length };
    });
  }, [leaves]);

  // Shrinkage forecast
  const shrinkageForecast = [
    { month: 'January', pct: 6.2, target: rules.maxDailyPct },
    { month: 'February', pct: 7.8, target: rules.maxDailyPct },
    { month: 'March', pct: 9.1, target: rules.maxDailyPct },
  ];

  // Risk dates
  const riskDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    filteredLeaves.forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
    return Object.entries(dateMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([date, requests]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      requests,
      severity: requests >= 6 ? 'High' : requests >= 3 ? 'Moderate' : 'Low',
      desc: `${requests} concurrent requests`,
    }));
  }, [filteredLeaves]);

  // Dept risk
  const deptRisk = useMemo(() => deptBreakdown.slice(0, 6).map(d => ({
    name: d.dept.replace('Messaging - ', '').replace('Messaging ', ''),
    shrinkage: d.shrinkage,
    risk: d.shrinkage > 8 ? 'High' : d.shrinkage > 5 ? 'Moderate' : 'Low',
  })), [deptBreakdown]);

  const deptScatter = useMemo(() => deptBreakdown.map((d, i) => ({
    name: d.dept.replace('Messaging - ', 'M-').replace('Messaging ', 'M-'),
    leavesPerAgent: d.avgPerAgent,
    shrinkage: d.shrinkage,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  })), [deptBreakdown]);

  const selectedDeptName = deptFilter === 'all' ? 'All Departments' : departments.find(d => d.id === deptFilter)?.name ?? '';

  // Recommendations
  const recommendations = [
    { title: 'Redistribute peak-day leaves', desc: 'Multiple dates show 6+ concurrent requests. Recommend staggering.', severity: 'high' },
    { title: 'Increase caps for Inbound team', desc: 'Inbound department consistently hits monthly cap. Consider raising to 3/agent.', severity: 'medium' },
    { title: 'Review cross-department transfers', desc: 'High swap/transfer ratio in Outbound. May indicate scheduling issues.', severity: 'low' },
  ];

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Analytics Dashboard" title="Performance" highlight="Insights" description={`Enterprise analytics across ${departments.length} departments, ${totalAgents} agents, and ${totalLeaves} leave requests.`} />

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-primary" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="glass-input w-auto min-w-[180px] py-2 text-xs">
            <option value="all">All Departments ({departments.length})</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border">
          {(['all', 'jan', 'feb', 'mar'] as const).map(t => (
            <button key={t} onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${timeRange === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >{t === 'all' ? 'All' : t}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search…" className="glass-input pl-8 py-2 text-xs" />
        </div>
        <span className="text-[10px] text-muted-foreground md:ml-auto flex items-center gap-1.5">
          <Building2 size={11} /> <strong className="text-foreground">{selectedDeptName}</strong>
        </span>
      </div>

      {/* KPI Row */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Forecast Accuracy" value="94.3%" icon={<Target size={18} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={totalLeaves} icon={<Calendar size={18} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={18} />} accent="success" trend={{ value: `${approvalRate}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pendingCount} icon={<Clock size={18} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Agents" value={totalAgents} icon={<Users size={18} />} accent="info" /></motion.div>
      </motion.div>

      {/* Row 1: Planned vs Actual + Shrinkage Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1">Planned vs Actual Attendance Trend</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Monthly volume with approved breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 22%, 88%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(0, 0%, 29%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(0, 0%, 29%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" name="Total" fill="hsl(215, 100%, 58%)" fillOpacity={0.5} radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="approved" name="Approved" fill="hsl(152, 69%, 42%)" fillOpacity={0.7} radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="rejected" name="Rejected" fill="hsl(0, 85%, 60%)" fillOpacity={0.5} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1">Shrinkage % Forecast</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Monthly shrinkage with target at {rules.maxDailyPct}%</p>
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
                  <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/40" style={{ left: `${(m.target / 15) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: High Risk + Department Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" /> High-Risk Dates
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Dates with most concurrent requests</p>
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
            <Shield size={14} className="text-info" /> Department Risk Analysis
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Shrinkage levels across departments</p>
          <div className="space-y-3">
            {deptRisk.map(d => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{d.shrinkage}%</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${d.risk === 'High' ? 'bg-destructive/10 text-destructive border-destructive/15' : d.risk === 'Moderate' ? 'bg-warning/10 text-warning border-warning/15' : 'bg-success/10 text-success border-success/15'}`}>
                      {d.risk}
                    </span>
                  </div>
                </div>
                <Progress value={(d.shrinkage / 15) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Status Donut + Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1">Status Distribution</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Current request breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
                {statusData.map((entry, idx) => <Cell key={idx} fill={entry.fill} opacity={0.8} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-[9px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.fill }} />
                <span className="text-muted-foreground truncate">{s.name}</span>
                <span className="font-bold ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
            <Layers size={14} className="text-accent" /> Department Heatmap
          </h3>
          <p className="text-[10px] text-muted-foreground mb-3">Leave volume by department</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {treemapData.slice(0, 6).map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-[8px] text-muted-foreground">
                <span className="w-2 h-2 rounded-sm" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                {d.name.replace('Messaging - ', 'M-').replace('Messaging ', 'M-')}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <Treemap data={treemapData} dataKey="size" nameKey="name" content={<TreemapContent />} animationDuration={400} />
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Dept Efficiency + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
            <Target size={14} className="text-info" /> Department Efficiency
          </h3>
          <p className="text-[10px] text-muted-foreground mb-3">Leaves per agent by department</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={deptScatter} margin={{ bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 22%, 88%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(0, 0%, 29%)', fontSize: 9 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'hsl(0, 0%, 29%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="leavesPerAgent" name="Leaves/Agent" barSize={20} radius={[4, 4, 0, 0]} fillOpacity={0.6}>
                {deptScatter.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Bar>
              <Line type="monotone" dataKey="shrinkage" name="Shrinkage %" stroke="hsl(37, 100%, 58%)" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: 'hsl(37, 100%, 58%)' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Rate Gauge + Quick Metrics */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center">
            <h3 className="text-sm font-bold font-heading mb-3 flex items-center gap-2">
              <Target size={14} className="text-primary" /> Approval Rate
            </h3>
            <ResponsiveContainer width="100%" height={110}>
              <RadialBarChart cx="50%" cy="55%" innerRadius="60%" outerRadius="90%" data={[{ value: approvalRate, fill: 'hsl(152, 69%, 42%)' }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(25, 22%, 88%)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-4 text-center">
              <span className="text-2xl font-extrabold text-primary font-heading">{approvalRate}%</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">{approved} of {decided} decided</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold font-heading flex items-center gap-2"><Zap size={13} className="text-accent" /> Quick Metrics</h3>
            {[
              { label: 'Avg leaves/agent', value: totalAgents > 0 ? (totalLeaves / totalAgents).toFixed(1) : '0', icon: ArrowUpRight, color: 'text-info' },
              { label: 'Rejection rate', value: decided > 0 ? `${Math.round((rejected / decided) * 100)}%` : '0%', icon: ArrowDownRight, color: 'text-destructive' },
              { label: 'Swap/Transfer', value: `${filteredLeaves.filter(l => l.type === 'Swap' || l.type === 'Transfer').length}`, icon: Activity, color: 'text-accent' },
              { label: 'Pending queue', value: `${pendingCount + peerPending}`, icon: Clock, color: 'text-warning' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <m.icon size={11} className={m.color} />
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
                <span className="text-xs font-bold">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Recommendations */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
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
                  <Eye size={10} /> Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-bold font-heading">Department Breakdown</h3>
          <p className="text-[10px] text-muted-foreground">{deptBreakdown.length} departments</p>
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto scrollbar-hidden">
          <table className="w-full text-[11px] premium-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Department</th><th>Agents</th><th>Total</th><th>Approved</th><th>Rejected</th><th>Pending</th><th>Avg/Agent</th><th>Shrinkage</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map((d, i) => (
                <motion.tr key={d.dept} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`cursor-pointer ${deptFilter === d.id ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                  onClick={() => setDeptFilter(deptFilter === d.id ? 'all' : d.id)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                      <span className="font-semibold">{d.dept}</span>
                    </div>
                  </td>
                  <td>{d.agents}</td>
                  <td className="font-bold">{d.leaves}</td>
                  <td className="text-success font-semibold">{d.approved}</td>
                  <td className="text-destructive font-semibold">{d.rejected}</td>
                  <td>{d.pending > 0 ? <span className="text-warning font-bold">{d.pending}</span> : '0'}</td>
                  <td>{d.avgPerAgent}</td>
                  <td className="font-semibold">{d.shrinkage}%</td>
                  <td>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${d.shrinkage > 8 ? 'bg-warning/10 text-warning border-warning/15' : d.shrinkage > 5 ? 'bg-info/10 text-info border-info/15' : 'bg-success/10 text-success border-success/15'}`}>
                      {d.shrinkage > 8 ? 'Critical' : d.shrinkage > 5 ? 'Watch' : 'Healthy'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}