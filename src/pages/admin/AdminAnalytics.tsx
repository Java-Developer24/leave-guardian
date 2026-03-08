import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { Calendar, TrendingUp, Users, Activity, Search, Filter, Building2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';

const tooltipStyle = {
  background: 'hsl(225, 15%, 9%)',
  border: '1px solid hsl(225, 12%, 13%)',
  borderRadius: 14,
  fontSize: 12,
  boxShadow: '0 8px 30px hsla(0,0%,0%,0.4)',
};

const PIE_COLORS = [
  'hsl(354, 100%, 64%)', 'hsl(35, 100%, 60%)', 'hsl(215, 100%, 58%)',
  'hsl(152, 69%, 42%)', 'hsl(280, 80%, 60%)', 'hsl(190, 90%, 50%)',
  'hsl(45, 100%, 50%)', 'hsl(320, 80%, 55%)', 'hsl(160, 60%, 45%)',
  'hsl(10, 90%, 55%)', 'hsl(240, 60%, 60%)',
];

export default function AdminAnalytics() {
  const { users, leaves, departments } = useAppStore();
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeaves = deptFilter === 'all' ? leaves : leaves.filter(l => l.departmentId === deptFilter);
  const totalAgents = users.filter(u => u.role === 'agent' && (deptFilter === 'all' || u.departmentId === deptFilter)).length;
  const totalLeaves = filteredLeaves.length;
  const approved = filteredLeaves.filter(l => l.status === 'Approved').length;
  const decided = filteredLeaves.filter(l => ['Approved', 'Rejected'].includes(l.status)).length;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
  const pendingCount = filteredLeaves.filter(l => l.status === 'PendingSupervisor').length;

  const deptBreakdown = useMemo(() => {
    return departments
      .filter(dept => {
        if (deptFilter !== 'all' && dept.id !== deptFilter) return false;
        if (searchTerm && !dept.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .map(dept => {
        const agents = users.filter(u => u.role === 'agent' && u.departmentId === dept.id).length;
        const deptLeaves = leaves.filter(l => l.departmentId === dept.id).length;
        const deptApproved = leaves.filter(l => l.departmentId === dept.id && l.status === 'Approved').length;
        const shrinkage = agents > 0 ? parseFloat(((deptApproved / Math.max(1, agents * 20)) * 100).toFixed(1)) : 0;
        const pending = leaves.filter(l => l.departmentId === dept.id && l.status === 'PendingSupervisor').length;
        return { id: dept.id, dept: dept.name, agents, leaves: deptLeaves, shrinkage, pending, approved: deptApproved };
      }).sort((a, b) => b.agents - a.agents);
  }, [departments, users, leaves, deptFilter, searchTerm]);

  const pieData = useMemo(() => deptBreakdown.map(d => ({ name: d.dept, value: d.leaves })), [deptBreakdown]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => {
      const planned = filteredLeaves.filter(l => l.type === 'Planned').length * (0.12 + i * 0.03);
      const actual = planned * (0.9 + Math.random() * 0.3);
      return { month, planned: Math.round(planned), actual: Math.round(actual), shrinkage: parseFloat((5 + Math.random() * 6).toFixed(1)) };
    });
  }, [filteredLeaves]);

  const riskDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    filteredLeaves.filter(l => l.status === 'PendingSupervisor' || l.status === 'Approved').forEach(l => {
      dateMap[l.date] = (dateMap[l.date] || 0) + 1;
    });
    return Object.entries(dateMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([date, requests]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        shrinkage: parseFloat((requests * 1.5 + Math.random() * 3).toFixed(1)),
        requests,
      }));
  }, [filteredLeaves]);

  const targetPct = decided > 0 ? Math.round((approved / decided) * 100) : 0;
  const gaugeData = [{ name: 'Target', value: targetPct, fill: 'url(#gaugeGrad)' }];
  const selectedDeptName = deptFilter === 'all' ? 'All Departments' : departments.find(d => d.id === deptFilter)?.name ?? '';

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Analytics Dashboard" title="Performance" highlight="Insights" description={`Deep-dive analytics across ${departments.length} departments, ${totalAgents} agents, and ${totalLeaves} leave requests.`} />

      {/* Department Filter Bar */}
      <div className="glass-card p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center border border-primary/10">
            <Filter size={15} className="text-primary" />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="glass-input w-auto min-w-[220px]"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map(d => {
              const count = users.filter(u => u.role === 'agent' && u.departmentId === d.id).length;
              return <option key={d.id} value={d.id}>{d.name} ({count} agents)</option>;
            })}
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search departments..."
            className="glass-input pl-10 py-2.5"
          />
        </div>
        <span className="text-xs text-muted-foreground/50 sm:ml-auto flex items-center gap-1.5">
          <Building2 size={12} />
          Viewing: <strong className="text-foreground font-semibold">{selectedDeptName}</strong>
        </span>
      </div>

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={totalLeaves} icon={<Calendar size={22} />} accent="primary" trend={{ value: `${departments.length} depts`, direction: 'up' }} sparkline={[30, 35, 42, 55, 70, totalLeaves]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={22} />} accent="success" sparkline={[70, 75, 80, 82, 85, approvalRate]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pendingCount} icon={<Activity size={22} />} accent="warning" trend={{ value: 'Needs action', direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Active Agents" value={totalAgents} icon={<Users size={22} />} accent="info" subtitle={deptFilter === 'all' ? `${departments.length} departments` : selectedDeptName} /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-7">
          <h3 className="font-bold tracking-heading mb-1 font-heading">Planned vs Actual Leaves</h3>
          <p className="text-[11px] text-muted-foreground mb-6">6-month trend comparison</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(354, 100%, 64%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(354, 100%, 64%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(35, 100%, 60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(35, 100%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(225,12%,18%,0.4)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(225,10%,48%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="planned" stroke="hsl(354, 100%, 64%)" fillOpacity={1} fill="url(#colorPlanned)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="actual" stroke="hsl(35, 100%, 60%)" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-7">
          <h3 className="font-bold tracking-heading mb-1 font-heading">High-Risk Dates</h3>
          <p className="text-[11px] text-muted-foreground mb-6">Most requested leave dates</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskDates}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(225,12%,18%,0.4)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(225,10%,48%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(225,10%,48%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="shrinkage" radius={[8, 8, 0, 0]} fill="hsl(354, 100%, 64%)" fillOpacity={0.65} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold tracking-heading mb-1 font-heading">Department Breakdown</h3>
              <p className="text-[11px] text-muted-foreground">Showing {deptBreakdown.length} of {departments.length} departments</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm premium-table">
              <thead className="sticky top-0 z-10"><tr><th className="text-left">Department</th><th>Agents</th><th>Leaves</th><th>Pending</th><th>Shrinkage</th><th>Status</th></tr></thead>
              <tbody>
                {deptBreakdown.map((d, i) => (
                  <motion.tr key={d.dept} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`cursor-pointer ${deptFilter === d.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setDeptFilter(deptFilter === d.id ? 'all' : d.id)}
                  >
                    <td className="text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[deptBreakdown.indexOf(d) % PIE_COLORS.length] }} />
                        <span className="font-semibold text-xs">{d.dept}</span>
                      </div>
                    </td>
                    <td className="font-medium">{d.agents}</td>
                    <td>{d.leaves}</td>
                    <td><span className={d.pending > 0 ? 'text-warning font-bold' : 'text-muted-foreground'}>{d.pending}</span></td>
                    <td className="font-semibold">{d.shrinkage}%</td>
                    <td>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${d.shrinkage > 8 ? 'bg-warning/10 text-warning border-warning/12' : 'bg-success/10 text-success border-success/12'}`}>
                        {d.shrinkage > 8 ? 'Watch' : 'Healthy'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="glass-card p-7">
            <h3 className="font-bold tracking-heading mb-1 font-heading text-sm">Leave Distribution</h3>
            <p className="text-[11px] text-muted-foreground mb-4">By department</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gauge */}
          <div className="glass-card gradient-border p-7 flex flex-col items-center justify-center">
            <h3 className="font-bold tracking-heading mb-4 font-heading text-sm">Target Achievement</h3>
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(354, 100%, 64%)" />
                    <stop offset="100%" stopColor="hsl(35, 100%, 60%)" />
                  </linearGradient>
                </defs>
                <RadialBar dataKey="value" cornerRadius={12} background={{ fill: 'hsl(225,12%,13%)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-6 text-center">
              <span className="text-3xl font-extrabold gradient-text font-heading">{targetPct}%</span>
              <p className="text-[10px] text-muted-foreground mt-1">approval rate achieved</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
