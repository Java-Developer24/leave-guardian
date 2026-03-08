import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { Calendar, TrendingUp, Users, Activity, Search, Filter, Building2, Clock, CheckCircle, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Target, Zap } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell, LineChart, Line, Legend,
  Treemap, ComposedChart, Scatter
} from 'recharts';

const tooltipStyle = {
  background: 'hsl(225, 15%, 8%)',
  border: '1px solid hsl(225, 12%, 16%)',
  borderRadius: 16,
  fontSize: 11,
  boxShadow: '0 12px 40px hsla(0,0%,0%,0.5)',
  padding: '10px 14px',
};

const DEPT_COLORS = [
  'hsl(354, 100%, 64%)', 'hsl(35, 100%, 60%)', 'hsl(215, 100%, 58%)',
  'hsl(152, 69%, 42%)', 'hsl(280, 80%, 60%)', 'hsl(190, 90%, 50%)',
  'hsl(45, 100%, 50%)', 'hsl(320, 80%, 55%)', 'hsl(160, 60%, 45%)',
  'hsl(10, 90%, 55%)', 'hsl(240, 60%, 60%)',
];

const STATUS_COLORS: Record<string, string> = {
  Approved: 'hsl(152, 69%, 42%)',
  Rejected: 'hsl(0, 85%, 60%)',
  PendingSupervisor: 'hsl(35, 100%, 60%)',
  PendingPeer: 'hsl(215, 100%, 58%)',
};

// Custom Treemap content
function TreemapContent(props: any) {
  const { x, y, width, height, name, value, index } = props;
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8}
        fill={DEPT_COLORS[index % DEPT_COLORS.length]}
        fillOpacity={0.25}
        stroke={DEPT_COLORS[index % DEPT_COLORS.length]}
        strokeWidth={1.5}
        strokeOpacity={0.4}
      />
      {width > 60 && height > 40 && (
        <>
          <text x={x + 8} y={y + 18} fontSize={10} fontWeight={700} fill="hsl(210,20%,96%)" fontFamily="Space Grotesk">
            {name?.length > width / 7 ? name.slice(0, Math.floor(width / 7)) + '…' : name}
          </text>
          <text x={x + 8} y={y + 32} fontSize={9} fill="hsl(225,10%,48%)" fontFamily="DM Sans">
            {value} leaves
          </text>
        </>
      )}
    </g>
  );
}

export default function AdminAnalytics() {
  const { users, leaves, departments } = useAppStore();
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'all' | 'jan' | 'feb' | 'mar'>('all');

  // Time filter
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

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    return departments
      .filter(dept => {
        if (deptFilter !== 'all' && dept.id !== deptFilter) return false;
        if (searchTerm && !dept.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .map(dept => {
        const agents = users.filter(u => u.role === 'agent' && u.departmentId === dept.id).length;
        const deptLeaves = timeFilteredLeaves.filter(l => l.departmentId === dept.id);
        const deptApproved = deptLeaves.filter(l => l.status === 'Approved').length;
        const deptRejected = deptLeaves.filter(l => l.status === 'Rejected').length;
        const deptPending = deptLeaves.filter(l => l.status === 'PendingSupervisor').length;
        const avgPerAgent = agents > 0 ? parseFloat((deptLeaves.length / agents).toFixed(1)) : 0;
        const shrinkage = agents > 0 ? parseFloat(((deptApproved / Math.max(1, agents * 20)) * 100).toFixed(1)) : 0;
        return { id: dept.id, dept: dept.name, agents, leaves: deptLeaves.length, approved: deptApproved, rejected: deptRejected, pending: deptPending, avgPerAgent, shrinkage };
      }).sort((a, b) => b.agents - a.agents);
  }, [departments, users, timeFilteredLeaves, deptFilter, searchTerm]);

  // Status distribution for donut
  const statusData = useMemo(() => [
    { name: 'Approved', value: approved, fill: STATUS_COLORS.Approved },
    { name: 'Rejected', value: rejected, fill: STATUS_COLORS.Rejected },
    { name: 'Pending Supervisor', value: pendingCount, fill: STATUS_COLORS.PendingSupervisor },
    { name: 'Pending Peer', value: peerPending, fill: STATUS_COLORS.PendingPeer },
  ].filter(d => d.value > 0), [approved, rejected, pendingCount, peerPending]);

  // Treemap data
  const treemapData = useMemo(() => deptBreakdown.map(d => ({ name: d.dept, size: d.leaves })), [deptBreakdown]);

  // Monthly trend (stable - no random)
  const monthlyTrend = useMemo(() => {
    const months = [
      { key: '2026-01', label: 'Jan' },
      { key: '2026-02', label: 'Feb' },
      { key: '2026-03', label: 'Mar' },
    ];
    return months.map(m => {
      const mLeaves = leaves.filter(l => l.date.startsWith(m.key));
      return {
        month: m.label,
        total: mLeaves.length,
        approved: mLeaves.filter(l => l.status === 'Approved').length,
        rejected: mLeaves.filter(l => l.status === 'Rejected').length,
        pending: mLeaves.filter(l => l.status === 'PendingSupervisor').length,
        planned: mLeaves.filter(l => l.type === 'Planned').length,
        swapTransfer: mLeaves.filter(l => l.type === 'Swap' || l.type === 'Transfer').length,
      };
    });
  }, [leaves]);

  // Top risk dates
  const riskDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    filteredLeaves.forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
    return Object.entries(dateMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([date, requests]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        requests,
        shrinkage: parseFloat((requests * 1.2 + 2).toFixed(1)),
      }));
  }, [filteredLeaves]);

  // Dept comparison scatter
  const deptScatter = useMemo(() => deptBreakdown.map((d, i) => ({
    name: d.dept.replace('Messaging - ', 'M-').replace('Messaging ', 'M-'),
    agents: d.agents,
    leavesPerAgent: d.avgPerAgent,
    shrinkage: d.shrinkage,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  })), [deptBreakdown]);

  const selectedDeptName = deptFilter === 'all' ? 'All Departments' : departments.find(d => d.id === deptFilter)?.name ?? '';
  const targetPct = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Analytics Dashboard" title="Performance" highlight="Insights" description={`Enterprise analytics across ${departments.length} departments, ${totalAgents} agents, and ${totalLeaves} leave requests.`} />

      {/* ═══ Filter Toolbar ═══ */}
      <div className="glass-card-featured p-5 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center border border-primary/10">
            <Filter size={15} className="text-primary" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="glass-input w-auto min-w-[200px] py-2.5 text-xs">
            <option value="all">All Departments ({departments.length})</option>
            {departments.map(d => {
              const count = users.filter(u => u.role === 'agent' && u.departmentId === d.id).length;
              return <option key={d.id} value={d.id}>{d.name} ({count})</option>;
            })}
          </select>
        </div>
        <div className="flex gap-1 bg-secondary/20 rounded-xl p-1 border border-border/15">
          {(['all', 'jan', 'feb', 'mar'] as const).map(t => (
            <button key={t} onClick={() => setTimeRange(t)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${timeRange === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground/50 hover:text-foreground'}`}
            >{t === 'all' ? 'All' : t}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/25 pointer-events-none" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search…" className="glass-input pl-9 py-2 text-xs" />
        </div>
        <span className="text-[10px] text-muted-foreground/40 md:ml-auto flex items-center gap-1.5">
          <Building2 size={11} /> <strong className="text-foreground/70">{selectedDeptName}</strong>
        </span>
      </div>

      {/* ═══ KPI Row ═══ */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={totalLeaves} icon={<Calendar size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={20} />} accent="success" trend={{ value: `${approvalRate}%`, direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={20} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pendingCount} icon={<Clock size={20} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Agents" value={totalAgents} icon={<Users size={20} />} accent="info" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Departments" value={deptFilter === 'all' ? departments.length : 1} icon={<Layers size={20} />} accent="accent" /></motion.div>
      </motion.div>

      {/* ═══ Row 1: Trend + Status Donut ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 glass-card-featured p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold tracking-heading font-heading text-sm">Monthly Trend Analysis</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Leave volume, approvals & rejections by month</p>
            </div>
            <div className="flex items-center gap-4 text-[9px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(354, 100%, 64%)' }} />Total</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(152, 69%, 42%)' }} />Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(0, 85%, 60%)' }} />Rejected</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyTrend}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(354, 100%, 64%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(354, 100%, 64%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(225,12%,18%,0.3)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="hsl(354, 100%, 64%)" fill="url(#totalGrad)" strokeWidth={2.5} />
              <Bar dataKey="approved" fill="hsl(152, 69%, 42%)" fillOpacity={0.6} radius={[6, 6, 0, 0]} barSize={28} />
              <Bar dataKey="rejected" fill="hsl(0, 85%, 60%)" fillOpacity={0.5} radius={[6, 6, 0, 0]} barSize={28} />
              <Line type="monotone" dataKey="pending" stroke="hsl(35, 100%, 60%)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4, fill: 'hsl(35, 100%, 60%)' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-featured p-6">
          <h3 className="font-bold tracking-heading font-heading text-sm mb-1">Status Distribution</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Current request breakdown</p>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-2 text-[9px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.fill }} />
                <span className="text-muted-foreground/60 truncate">{s.name}</span>
                <span className="font-bold ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Row 2: Risk Dates + Dept Treemap ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="glass-card-featured p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold tracking-heading font-heading text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning" /> High-Risk Dates
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">Dates with most concurrent requests</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskDates} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(225,12%,18%,0.3)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="date" type="category" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="requests" radius={[0, 8, 8, 0]} fill="hsl(354, 100%, 64%)" fillOpacity={0.55} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-featured p-6">
          <h3 className="font-bold tracking-heading font-heading text-sm mb-1">Department Heatmap</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Leave volume by department (treemap)</p>
          <ResponsiveContainer width="100%" height={220}>
            <Treemap data={treemapData} dataKey="size" nameKey="name" content={<TreemapContent />} animationDuration={300} />
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Row 3: Department Scatter + Leave Types ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="glass-card-featured p-6">
          <h3 className="font-bold tracking-heading font-heading text-sm mb-1">Department Efficiency</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Team size vs leaves per agent</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={deptScatter}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(225,12%,18%,0.3)" />
              <XAxis dataKey="agents" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Team Size', fontSize: 9, fill: 'hsl(225,10%,48%)', position: 'bottom', offset: -5 }} />
              <YAxis dataKey="leavesPerAgent" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Leaves/Agent', fontSize: 9, fill: 'hsl(225,10%,48%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Scatter dataKey="leavesPerAgent" fill="hsl(354, 100%, 64%)" fillOpacity={0.6}>
                {deptScatter.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-featured p-6">
          <h3 className="font-bold tracking-heading font-heading text-sm mb-1">Leave Type Breakdown</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Planned vs Swap/Transfer by month</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(225,12%,18%,0.3)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="planned" name="Planned" fill="hsl(215, 100%, 58%)" fillOpacity={0.6} radius={[6, 6, 0, 0]} />
              <Bar dataKey="swapTransfer" name="Swap/Transfer" fill="hsl(280, 80%, 60%)" fillOpacity={0.6} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Row 4: Department Table + Gauges ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold tracking-heading font-heading text-sm">Department Breakdown</h3>
              <p className="text-[10px] text-muted-foreground">Click a row to filter • {deptBreakdown.length} departments</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto scrollbar-hidden">
            <table className="w-full text-[11px] premium-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-left">Department</th>
                  <th>Agents</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Pending</th>
                  <th>Avg/Agent</th>
                  <th>Shrinkage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deptBreakdown.map((d, i) => (
                  <motion.tr key={d.dept} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`cursor-pointer transition-colors ${deptFilter === d.id ? 'bg-primary/6' : 'hover:bg-card/50'}`}
                    onClick={() => setDeptFilter(deptFilter === d.id ? 'all' : d.id)}
                  >
                    <td className="text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                        <span className="font-semibold">{d.dept}</span>
                      </div>
                    </td>
                    <td className="font-medium">{d.agents}</td>
                    <td className="font-bold">{d.leaves}</td>
                    <td><span className="text-success font-semibold">{d.approved}</span></td>
                    <td><span className="text-destructive font-semibold">{d.rejected}</span></td>
                    <td><span className={d.pending > 0 ? 'text-warning font-bold' : 'text-muted-foreground'}>{d.pending}</span></td>
                    <td className="font-medium">{d.avgPerAgent}</td>
                    <td className="font-semibold">{d.shrinkage}%</td>
                    <td>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold border ${d.shrinkage > 8 ? 'bg-warning/10 text-warning border-warning/12' : d.shrinkage > 5 ? 'bg-info/10 text-info border-info/12' : 'bg-success/10 text-success border-success/12'}`}>
                        {d.shrinkage > 8 ? 'Critical' : d.shrinkage > 5 ? 'Watch' : 'Healthy'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          {/* Approval Rate Gauge */}
          <div className="glass-card gradient-border p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-primary" />
              <h3 className="font-bold tracking-heading font-heading text-sm">Approval Rate</h3>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart cx="50%" cy="55%" innerRadius="62%" outerRadius="92%" data={[{ value: targetPct, fill: 'url(#gaugeGrad2)' }]} startAngle={180} endAngle={0}>
                <defs>
                  <linearGradient id="gaugeGrad2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(152, 69%, 42%)" />
                    <stop offset="100%" stopColor="hsl(35, 100%, 60%)" />
                  </linearGradient>
                </defs>
                <RadialBar dataKey="value" cornerRadius={12} background={{ fill: 'hsl(225,12%,13%)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-5 text-center">
              <span className="text-3xl font-extrabold gradient-text font-heading">{targetPct}%</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">{approved} of {decided} decided</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-bold tracking-heading font-heading text-xs flex items-center gap-2">
              <Zap size={13} className="text-accent" /> Quick Metrics
            </h3>
            {[
              { label: 'Avg leaves per agent', value: totalAgents > 0 ? (totalLeaves / totalAgents).toFixed(1) : '0', icon: ArrowUpRight, color: 'text-info' },
              { label: 'Rejection rate', value: decided > 0 ? `${Math.round((rejected / decided) * 100)}%` : '0%', icon: ArrowDownRight, color: 'text-destructive' },
              { label: 'Swap/Transfer ratio', value: `${filteredLeaves.filter(l => l.type === 'Swap' || l.type === 'Transfer').length}`, icon: Activity, color: 'text-accent' },
              { label: 'Pending queue', value: `${pendingCount + peerPending}`, icon: Clock, color: 'text-warning' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                <div className="flex items-center gap-2.5">
                  <m.icon size={12} className={m.color} />
                  <span className="text-[10px] text-muted-foreground/60">{m.label}</span>
                </div>
                <span className="text-xs font-bold">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
