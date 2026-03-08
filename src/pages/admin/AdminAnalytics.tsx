import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { Calendar, TrendingUp, Users, Activity } from 'lucide-react';
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
  { date: 'Mar 15', shrinkage: 9.2, requests: 4 },
  { date: 'Mar 22', shrinkage: 8.7, requests: 3 },
  { date: 'Apr 02', shrinkage: 11.5, requests: 5 },
  { date: 'Apr 15', shrinkage: 7.8, requests: 2 },
  { date: 'May 01', shrinkage: 14.2, requests: 6 },
];

const gaugeData = [{ name: 'Shrinkage', value: 79, fill: 'url(#gaugeGrad)' }];

const tooltipStyle = {
  background: 'hsl(225, 15%, 9%)',
  border: '1px solid hsl(225, 12%, 13%)',
  borderRadius: 14,
  fontSize: 12,
  boxShadow: '0 8px 30px hsla(0,0%,0%,0.4)',
};

export default function AdminAnalytics() {
  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Analytics Dashboard" title="Performance" highlight="Insights" description="Deep-dive analytics across leave metrics, shrinkage trends, and departmental performance." />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={51} icon={<Calendar size={22} />} accent="primary" trend={{ value: '+12%', direction: 'up' }} sparkline={[30, 35, 42, 38, 45, 51]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approval Rate" value="87%" icon={<TrendingUp size={22} />} accent="success" sparkline={[70, 75, 80, 82, 85, 87]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Avg Shrinkage" value="7.9%" icon={<Activity size={22} />} accent="warning" trend={{ value: '-0.3%', direction: 'down' }} sparkline={[9, 8.5, 8.2, 8, 7.9]} /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Active Agents" value={7} icon={<Users size={22} />} accent="info" /></motion.div>
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
          <p className="text-[11px] text-muted-foreground mb-6">Shrinkage % on upcoming dates</p>
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
          <p className="text-[11px] text-muted-foreground mb-6">Leave and shrinkage per department</p>
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
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${d.shrinkage > 8 ? 'bg-warning/10 text-warning border-warning/12' : 'bg-success/10 text-success border-success/12'}`}>
                      {d.shrinkage > 8 ? 'Watch' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <span className="text-4xl font-extrabold gradient-text font-heading">79%</span>
            <p className="text-[10px] text-muted-foreground mt-1.5">of shrinkage target met</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
