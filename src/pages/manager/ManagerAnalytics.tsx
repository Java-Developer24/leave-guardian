import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { toDateStr } from '@/core/utils/dates';
import {
  Building2,
  Users,
  UserRound,
  BarChart3,
  Gauge,
  AlertTriangle,
} from 'lucide-react';

export default function ManagerAnalytics() {
  const { departments, users, leaves, schedule, forecastAlerts } = useAppStore();
  const todayStr = toDateStr(new Date());
  const currentMonthKey = todayStr.slice(0, 7);

  const departmentRows = useMemo(() => {
    return departments.map(dept => {
      const deptGuides = users.filter(user => user.role === 'agent' && user.departmentId === dept.id);
      const deptSupervisors = users.filter(user => user.role === 'supervisor' && user.departmentId === dept.id);
      const deptLeaves = leaves.filter(leave => leave.departmentId === dept.id);
      const pending = deptLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer'].includes(leave.status)).length;
      const approved = deptLeaves.filter(leave => leave.status === 'Approved').length;
      const shrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);
      const alerts = forecastAlerts.filter(alert => alert.departmentId === dept.id && alert.status === 'Open').length;

      return {
        id: dept.id,
        name: dept.name,
        guides: deptGuides.length,
        supervisors: deptSupervisors.length,
        approved,
        pending,
        shrinkage: Number(shrinkage.toFixed(1)),
        alerts,
      };
    }).sort((a, b) => b.shrinkage - a.shrinkage);
  }, [departments, users, leaves, todayStr, schedule, forecastAlerts]);

  const supervisorRows = useMemo(() => {
    return users
      .filter(user => user.role === 'supervisor')
      .map(supervisor => {
        const teamSize = users.filter(user => user.role === 'agent' && user.departmentId === supervisor.departmentId).length;
        const teamLeaves = leaves.filter(leave => leave.departmentId === supervisor.departmentId);
        const pendingApprovals = teamLeaves.filter(leave => leave.status === 'PendingSupervisor').length;
        const approvedThisMonth = teamLeaves.filter(leave => leave.status === 'Approved' && leave.date.startsWith(currentMonthKey)).length;
        const shrinkage = calcDailyShrinkage(todayStr, teamLeaves, schedule);
        const deptName = departments.find(dept => dept.id === supervisor.departmentId)?.name ?? 'Department';

        return {
          id: supervisor.id,
          name: supervisor.name,
          deptName,
          teamSize,
          pendingApprovals,
          approvedThisMonth,
          shrinkage: Number(shrinkage.toFixed(1)),
        };
      })
      .sort((a, b) => b.pendingApprovals - a.pendingApprovals);
  }, [users, leaves, currentMonthKey, todayStr, schedule, departments]);

  const guideRows = useMemo(() => {
    return users
      .filter(user => user.role === 'agent')
      .map(guide => {
        const guideLeaves = leaves.filter(leave => leave.requesterId === guide.id);
        const approved = guideLeaves.filter(leave => leave.status === 'Approved').length;
        const pending = guideLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer'].includes(leave.status)).length;
        const rejected = guideLeaves.filter(leave => leave.status === 'Rejected').length;
        const swaps = guideLeaves.filter(leave => leave.type === 'Swap').length;
        const deptName = departments.find(dept => dept.id === guide.departmentId)?.name ?? 'Department';

        return {
          id: guide.id,
          name: guide.name,
          deptName,
          approved,
          pending,
          rejected,
          swaps,
        };
      })
      .sort((a, b) => (b.pending + b.approved) - (a.pending + a.approved))
      .slice(0, 20);
  }, [users, leaves, departments]);

  const openAlerts = forecastAlerts.filter(alert => alert.status === 'Open').length;
  const highestShrinkage = departmentRows.length > 0 ? Math.max(...departmentRows.map(row => row.shrinkage)) : 0;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Manager Persona"
        title="Enterprise"
        highlight="Analytics"
        description="Department, supervisor, and guide level analytics using the existing leave, shrinkage, and forecast data."
      />

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <motion.div variants={staggerItem}><KpiCard label="Departments" value={departments.length} icon={<Building2 size={18} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Supervisors" value={supervisorRows.length} icon={<Users size={18} />} accent="accent" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Guides" value={users.filter(user => user.role === 'agent').length} icon={<UserRound size={18} />} accent="info" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Open Alerts" value={openAlerts} icon={<AlertTriangle size={18} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Peak Shrinkage" value={`${highestShrinkage.toFixed(1)}%`} icon={<Gauge size={18} />} accent="success" /></motion.div>
      </motion.div>

      <Tabs defaultValue="department" className="w-full">
        <TabsList className="bg-muted/50 border border-border mb-6">
          <TabsTrigger value="department" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Department</TabsTrigger>
          <TabsTrigger value="supervisor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Supervisor</TabsTrigger>
          <TabsTrigger value="guide" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="department">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {departmentRows.map(row => (
              <div key={row.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">{row.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{row.guides} guides • {row.supervisors} supervisors</div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${row.shrinkage > 8 ? 'bg-destructive/10 text-destructive border-destructive/15' : row.shrinkage > 5 ? 'bg-warning/10 text-warning border-warning/15' : 'bg-success/10 text-success border-success/15'}`}>
                    {row.shrinkage > 8 ? 'High Risk' : row.shrinkage > 5 ? 'Watch' : 'Stable'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Approved</div>
                    <div className="mt-1 font-semibold">{row.approved}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Pending</div>
                    <div className="mt-1 font-semibold">{row.pending}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Shrinkage</div>
                    <div className="mt-1 font-semibold">{row.shrinkage}%</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Forecast Alerts</div>
                    <div className="mt-1 font-semibold">{row.alerts}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="supervisor">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm premium-table">
                <thead>
                  <tr>
                    <th>Supervisor</th>
                    <th>Department</th>
                    <th>Team Size</th>
                    <th>Pending Approvals</th>
                    <th>Approved This Month</th>
                    <th>Shrinkage</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisorRows.map(row => (
                    <tr key={row.id}>
                      <td className="font-semibold">{row.name}</td>
                      <td>{row.deptName}</td>
                      <td>{row.teamSize}</td>
                      <td>{row.pendingApprovals}</td>
                      <td>{row.approvedThisMonth}</td>
                      <td className={row.shrinkage > 8 ? 'text-destructive font-semibold' : 'font-semibold'}>{row.shrinkage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guide">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm premium-table">
                <thead>
                  <tr>
                    <th>Guide</th>
                    <th>Department</th>
                    <th>Approved</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                    <th>Swaps</th>
                  </tr>
                </thead>
                <tbody>
                  {guideRows.map(row => (
                    <tr key={row.id}>
                      <td className="font-semibold">{row.name}</td>
                      <td>{row.deptName}</td>
                      <td className="text-success font-semibold">{row.approved}</td>
                      <td>{row.pending}</td>
                      <td>{row.rejected}</td>
                      <td>{row.swaps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
