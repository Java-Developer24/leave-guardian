import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { Calendar, TrendingUp, Users, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

const tooltipStyle = {
  background: 'hsl(225, 15%, 9%)',
  border: '1px solid hsl(225, 12%, 13%)',
  borderRadius: 14,
  fontSize: 12,
  boxShadow: '0 8px 30px hsla(0,0%,0%,0.4)',
};

export default function AdminAnalytics() {
  const { users, leaves, departments } = useAppStore();

  const totalAgents = users.filter(u => u.role === 'agent').length;
  const totalLeaves = leaves.length;
  const approved = leaves.filter(l => l.status === 'Approved').length;
  const decided = leaves.filter(l => ['Approved', 'Rejected'].includes(l.status)).length;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  const deptBreakdown = useMemo(() => {
    return departments.map(dept => {
      const agents = users.filter(u => u.role === 'agent' && u.departmentId === dept.id).length;
      const deptLeaves = leaves.filter(l => l.departmentId === dept.id).length;
      const deptApproved = leaves.filter(l => l.departmentId === dept.id && l.status === 'Approved').length;
      const shrinkage = agents > 0 ? parseFloat(((deptApproved / Math.max(1, agents * 20)) * 100).toFixed(1)) : 0;
      const pending = leaves.filter(l => l.departmentId === dept.id && l.status === 'PendingSupervisor').length;
      return { dept: dept.name, agents, leaves: deptLeaves, shrinkage, pending };
    }).sort((a, b) => b.agents - a.agents);
  }, [departments, users, leaves]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => {
      const planned = leaves.filter(l => l.type === 'Planned').length * (0.12 + i * 0.03);
      const actual = planned * (0.9 + Math.random() * 0.3);
      return { month, planned: Math.round(planned), actual: Math.round(actual), shrinkage: parseFloat((5 + Math.random() * 6).toFixed(1)) };
    });
  }, [leaves]);

  const riskDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    leaves.filter(l => l.status === 'PendingSupervisor' || l.status === 'Approved').forEach(l => {
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
  }, [leaves]);

  const targetPct = decided > 0 ? Math.round((approved / decided) * 100) : 0;
  const gaugeData = [{ name: 'Shrinkage', value: targetPct, fill: 'url(#gaugeGrad)' }];

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Analytics Dashboard" title="Performance" highlight="Insights" description={`Deep-dive analytics across ${departments.length} departments, ${totalAgents} agents, and ${totalLeaves} leave requests.`} />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={totalLeaves} icon={<Calendar size={22} />} accent="primary" trend={{ value: `${departments.length} depts`, direction: 'up' }} sparkline={[30, 35, 42, 55, 70, totalLeaves]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={22} />} accent="success" sparkline={[70, 75, 80, 82, 85, approvalRate]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={leaves.filter(l => l.status === 'PendingSupervisor').length} icon={<Activity size={22} />} accent="warning" trend={{ value: 'Needs action', direction: 'up' }} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Active Agents" value={totalAgents} icon={<Users size={22} />} accent="info" subtitle={`${departments.length} departments`} /></motion.div>
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
          <h3 className="font-bold tracking-heading mb-1 font-heading">Department Breakdown</h3>
          <p className="text-[11px] text-muted-foreground mb-6">Leave and shrinkage per department — {departments.length} departments</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm premium-table">
              <thead><tr><th className="text-left">Department</th><th>Agents</th><th>Leaves</th><th>Pending</th><th>Shrinkage</th><th>Status</th></tr></thead>
              <tbody>
                {deptBreakdown.map(d => (
                  <tr key={d.dept}>
                    <td className="font-semibold text-left">{d.dept}</td>
                    <td>{d.agents}</td>
                    <td>{d.leaves}</td>
                    <td><span className={d.pending > 0 ? 'text-warning font-bold' : ''}>{d.pending}</span></td>
                    <td className="font-semibold">{d.shrinkage}%</td>
                    <td>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${d.shrinkage > 8 ? 'bg-warning/10 text-warning border-warning/12' : 'bg-success/10 text-success border-success/12'}`}>
                        {d.shrinkage > 8 ? 'Watch' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card gradient-border p-7 flex flex-col items-center justify-center">
          <h3 className="font-bold tracking-heading mb-5 font-heading">Target Achievement</h3>
          <ResponsiveContainer width="100%" height={170}>
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
          <div className="-mt-8 text-center">
            <span className="text-4xl font-extrabold gradient-text font-heading">{targetPct}%</span>
            <p className="text-[10px] text-muted-foreground mt-1.5">of shrinkage target met</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
