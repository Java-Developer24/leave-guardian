import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, cardHover } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { AlertTriangle } from 'lucide-react';

function ProgressRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  const color = pct >= 95 ? 'hsl(152, 69%, 42%)' : pct >= 80 ? 'hsl(35, 100%, 60%)' : 'hsl(0, 85%, 60%)';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full stat-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-extrabold font-heading">{Math.round(pct)}%</span>
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
    if (deficit > 24) return { label: 'Critical', color: 'bg-destructive/10 text-destructive border-destructive/12' };
    if (deficit > 16) return { label: 'High', color: 'bg-warning/10 text-warning border-warning/12' };
    if (deficit > 8) return { label: 'Medium', color: 'bg-info/10 text-info border-info/12' };
    return { label: 'OK', color: 'bg-success/10 text-success border-success/12' };
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Team Management" title="Team" highlight="Summary"
        description={`${teamMembers.length} active agents — hours, leave usage, risk levels.`}
      />

      <div className="glass-card px-5 py-3 mb-4 flex flex-wrap items-center gap-8">
        {[
          { value: teamMembers.length, label: 'Agents', color: 'text-foreground' },
          { value: teamMembers.filter(m => m.deficit <= 8).length, label: 'On Track', color: 'text-success' },
          { value: teamMembers.filter(m => m.deficit > 16).length, label: 'At Risk', color: 'text-warning' },
          { value: teamMembers.reduce((s, m) => s + m.approved, 0), label: 'Taken', color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-xl font-extrabold font-heading ${s.color}`}>{s.value}</div>
            <div className="text-[8px] tracking-section uppercase text-muted-foreground font-semibold font-heading">{s.label}</div>
          </div>
        ))}
      </div>

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {teamMembers.map(m => {
          const risk = getRiskLevel(m.deficit);
          return (
            <motion.div key={m.id} variants={staggerItem} {...cardHover} className="glass-card gradient-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/12 to-accent/6 flex items-center justify-center border border-primary/8">
                    <span className="text-primary font-bold text-[10px]">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="font-bold text-xs truncate max-w-[100px]">{m.name}</div>
                    <div className="text-[8px] text-muted-foreground truncate max-w-[100px]">{m.email}</div>
                  </div>
                </div>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold border ${risk.color}`}>{risk.label}</span>
              </div>

              <div className="flex items-center gap-3">
                <ProgressRing pct={m.pct} />
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  {[
                    { v: m.approved, l: 'Taken', c: '' },
                    { v: m.pending, l: 'Pend', c: 'text-warning' },
                    { v: m.rejected, l: 'Rej', c: '' },
                  ].map(s => (
                    <div key={s.l} className="text-center p-1.5 bg-secondary/18 rounded-lg border border-border/10">
                      <div className={`text-sm font-bold font-heading ${s.c}`}>{s.v}</div>
                      <div className="text-[7px] text-muted-foreground tracking-wider uppercase font-heading">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground">Hours</span>
                  <span className="font-bold">{m.hoursDelivered}<span className="text-muted-foreground font-normal">/{m.hoursTarget}</span></span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.7, delay: 0.1 }} className="h-full accent-bar rounded-full" />
                </div>
              </div>

              {m.deficit > 16 && (
                <div className="flex items-center gap-1.5 text-[9px] text-warning bg-warning/6 px-2 py-1.5 rounded-lg border border-warning/8">
                  <AlertTriangle size={10} />
                  <span className="font-semibold">{m.deficit}h deficit</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
