import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, cardHover } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { User, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function SupervisorTeam() {
  const { users, leaves, currentUser } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';

  const teamMembers = useMemo(() => {
    const agents = users.filter(u => u.role === 'agent' && u.departmentId === deptId);
    return agents.map(agent => {
      const agentLeaves = leaves.filter(l => l.requesterId === agent.id);
      const approved = agentLeaves.filter(l => l.status === 'Approved').length;
      const pending = agentLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status)).length;
      const rejected = agentLeaves.filter(l => l.status === 'Rejected').length;
      const hoursTarget = 160;
      const hoursDelivered = hoursTarget - (approved * 8);
      const deficit = hoursTarget - hoursDelivered;
      const pct = Math.min(100, (hoursDelivered / hoursTarget) * 100);
      return { ...agent, approved, pending, rejected, hoursTarget, hoursDelivered, deficit, pct };
    }).sort((a, b) => b.deficit - a.deficit);
  }, [users, leaves, deptId]);

  const getRiskLevel = (deficit: number) => {
    if (deficit > 24) return { label: 'Critical', color: 'bg-destructive/15 text-destructive' };
    if (deficit > 16) return { label: 'High', color: 'bg-warning/15 text-warning' };
    if (deficit > 8) return { label: 'Normal', color: 'bg-info/15 text-info' };
    return { label: 'On Track', color: 'bg-success/15 text-success' };
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="TEAM MANAGEMENT"
        title="Team"
        highlight="Summary"
        description={`${teamMembers.length} active agents in your department. Monitor hours delivered, leave utilization, and risk levels.`}
      />

      {/* Summary bar */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-extrabold">{teamMembers.length}</div>
          <div className="text-[10px] tracking-section uppercase text-muted-foreground">Total Agents</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-success">{teamMembers.filter(m => m.deficit <= 8).length}</div>
          <div className="text-[10px] tracking-section uppercase text-muted-foreground">On Track</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-warning">{teamMembers.filter(m => m.deficit > 16).length}</div>
          <div className="text-[10px] tracking-section uppercase text-muted-foreground">At Risk</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-2xl font-extrabold">{teamMembers.reduce((s, m) => s + m.approved, 0)}</div>
          <div className="text-[10px] tracking-section uppercase text-muted-foreground">Leaves Taken</div>
        </div>
      </div>

      {/* Grid */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(m => {
          const risk = getRiskLevel(m.deficit);
          return (
            <motion.div key={m.id} variants={staggerItem} {...cardHover} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.email}</div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${risk.color}`}>{risk.label}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-secondary/30 rounded-lg">
                  <div className="text-lg font-bold">{m.approved}</div>
                  <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Taken</div>
                </div>
                <div className="text-center p-2 bg-secondary/30 rounded-lg">
                  <div className="text-lg font-bold text-warning">{m.pending}</div>
                  <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Pending</div>
                </div>
                <div className="text-center p-2 bg-secondary/30 rounded-lg">
                  <div className="text-lg font-bold">{m.rejected}</div>
                  <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Rejected</div>
                </div>
              </div>

              {/* Hours bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-muted-foreground">Hours Delivered</span>
                  <span className="font-semibold">{m.hoursDelivered}<span className="text-muted-foreground font-normal">/{m.hoursTarget}</span></span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
                    className="h-full accent-bar rounded-full"
                  />
                </div>
              </div>

              {m.deficit > 16 && (
                <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2.5 py-1.5 rounded-lg">
                  <AlertTriangle size={13} />
                  <span className="font-medium">{m.deficit}h deficit — needs attention</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
