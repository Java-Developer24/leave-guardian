import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, cardHover } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { AlertTriangle } from 'lucide-react';

function ProgressRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  const color = pct >= 95 ? 'hsl(142, 76%, 36%)' : pct >= 80 ? 'hsl(37, 100%, 58%)' : 'hsl(0, 84%, 60%)';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full stat-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(90deg)' }}>
        <span className="text-[11px] font-extrabold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

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
    if (deficit > 24) return { label: 'Critical', color: 'bg-destructive/12 text-destructive border-destructive/15' };
    if (deficit > 16) return { label: 'High', color: 'bg-warning/12 text-warning border-warning/15' };
    if (deficit > 8) return { label: 'Medium', color: 'bg-info/12 text-info border-info/15' };
    return { label: 'On Track', color: 'bg-success/12 text-success border-success/15' };
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="TEAM MANAGEMENT"
        title="Team"
        highlight="Summary"
        description={`${teamMembers.length} active agents. Monitor hours, leave utilization, and risk levels.`}
      />

      {/* Summary bar */}
      <div className="glass-card p-5 mb-6 flex flex-wrap items-center gap-8">
        {[
          { value: teamMembers.length, label: 'Total Agents', color: 'text-foreground' },
          { value: teamMembers.filter(m => m.deficit <= 8).length, label: 'On Track', color: 'text-success' },
          { value: teamMembers.filter(m => m.deficit > 16).length, label: 'At Risk', color: 'text-warning' },
          { value: teamMembers.reduce((s, m) => s + m.approved, 0), label: 'Leaves Taken', color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] tracking-section uppercase text-muted-foreground font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(m => {
          const risk = getRiskLevel(m.deficit);
          return (
            <motion.div key={m.id} variants={staggerItem} {...cardHover} className="glass-card gradient-border p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center border border-primary/10">
                    <span className="text-primary font-bold text-sm">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">{m.email}</div>
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${risk.color}`}>{risk.label}</span>
              </div>

              {/* Hours ring + stats */}
              <div className="flex items-center gap-4">
                <ProgressRing pct={m.pct} />
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <div className="text-center p-2 bg-secondary/20 rounded-xl">
                    <div className="text-base font-bold">{m.approved}</div>
                    <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Taken</div>
                  </div>
                  <div className="text-center p-2 bg-secondary/20 rounded-xl">
                    <div className="text-base font-bold text-warning">{m.pending}</div>
                    <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Pending</div>
                  </div>
                  <div className="text-center p-2 bg-secondary/20 rounded-xl">
                    <div className="text-base font-bold">{m.rejected}</div>
                    <div className="text-[8px] text-muted-foreground tracking-wider uppercase">Rejected</div>
                  </div>
                </div>
              </div>

              {/* Hours bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-muted-foreground">Hours Delivered</span>
                  <span className="font-bold">{m.hoursDelivered}<span className="text-muted-foreground font-normal">/{m.hoursTarget}h</span></span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="h-full accent-bar rounded-full"
                  />
                </div>
              </div>

              {m.deficit > 16 && (
                <div className="flex items-center gap-1.5 text-[10px] text-warning bg-warning/8 px-2.5 py-1.5 rounded-xl border border-warning/10">
                  <AlertTriangle size={12} />
                  <span className="font-semibold">{m.deficit}h deficit — needs attention</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
