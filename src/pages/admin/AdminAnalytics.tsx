import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { BarChart3, TrendingUp, Calendar, Users, Activity, PieChart } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

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

const deptData = [
  { name: 'Customer Care', leaves: 24, shrinkage: 8.4, fill: 'hsl(356, 98%, 62%)' },
  { name: 'Tech Support', leaves: 18, shrinkage: 7.1, fill: 'hsl(37, 100%, 58%)' },
];

const gaugeData = [{ name: 'Shrinkage', value: 79, fill: 'url(#gaugeGrad)' }];

export default function AdminAnalytics() {
  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="ANALYTICS DASHBOARD" title="Performance" highlight="Insights" description="Deep-dive analytics across leave metrics, shrinkage trends, and departmental performance." />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={51} icon={<Calendar size={20} />} accent="primary" trend={{ value: '+12%', direction: 'up' }} sparkline={[30, 35, 42, 38, 45, 51]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value="87%" icon={<TrendingUp size={20} />} accent="success" sparkline={[70, 75, 80, 82, 85, 87]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Avg Shrinkage" value="7.9%" icon={<Activity size={20} />} accent="warning" trend={{ value: '-0.3%', direction: 'down' }} sparkline={[9, 8.5, 8.2, 8, 7.9]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Active Agents" value={7} icon={<Users size={20} />} accent="info" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Area Chart */}
        <div className="glass-card p-6">
          <h3 className="font-bold tracking-heading mb-1">Planned vs Actual Leaves</h3>
          <p className="text-[11px] text-muted-foreground mb-4">6-month trend comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(356, 98%, 62%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(356, 98%, 62%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(37, 100%, 58%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(37, 100%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(220,10%,18%,0.5)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(220,8%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220,8%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(220,13%,10%)', border: '1px solid hsl(220,10%,14%)', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="planned" stroke="hsl(356, 98%, 62%)" fillOpacity={1} fill="url(#colorPlanned)" strokeWidth={2} />
              <Area type="monotone" dataKey="actual" stroke="hsl(37, 100%, 58%)" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Risk Dates */}
        <div className="glass-card p-6">
          <h3 className="font-bold tracking-heading mb-1">High-Risk Dates</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Shrinkage % on upcoming dates</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskDates}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(220,10%,18%,0.5)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(220,8%,50%)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220,8%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(220,13%,10%)', border: '1px solid hsl(220,10%,14%)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="shrinkage" radius={[6, 6, 0, 0]} fill="hsl(356, 98%, 62%)" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-bold tracking-heading mb-1">Department Breakdown</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Leave and shrinkage per department</p>
          <table className="w-full text-sm premium-table">
            <thead><tr><th>Department</th><th>Agents</th><th>Leaves</th><th>Shrinkage</th><th>Status</th></tr></thead>
            <tbody>
              {[
                { dept: 'Customer Care', agents: 5, leaves: 24, shrinkage: 8.4 },
                { dept: 'Technical Support', agents: 2, leaves: 18, shrinkage: 7.1 },
              ].map(d => (
                <tr key={d.dept}>
                  <td className="font-semibold">{d.dept}</td>
                  <td>{d.agents}</td>
                  <td>{d.leaves}</td>
                  <td className="font-semibold">{d.shrinkage}%</td>
                  <td>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${d.shrinkage > 8 ? 'bg-warning/12 text-warning' : 'bg-success/12 text-success'}`}>
                      {d.shrinkage > 8 ? 'Watch' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gauge */}
        <div className="glass-card gradient-border p-6 flex flex-col items-center justify-center">
          <h3 className="font-bold tracking-heading mb-4">Target Achievement</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(356, 98%, 62%)" />
                  <stop offset="100%" stopColor="hsl(37, 100%, 58%)" />
                </linearGradient>
              </defs>
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(220,10%,14%)' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-8 text-center">
            <span className="text-3xl font-extrabold gradient-text">79%</span>
            <p className="text-[10px] text-muted-foreground mt-1">of shrinkage target met</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
