import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, cardHover } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import { User, AlertTriangle } from 'lucide-react';

export default function SupervisorTeam() {
  const { users, leaves, currentUser } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';

  const teamMembers = useMemo(() => {
    const agents = users.filter(u => u.role === 'agent' && u.departmentId === deptId);
    return agents.map(agent => {
      const agentLeaves = leaves.filter(l => l.requesterId === agent.id);
      const approved = agentLeaves.filter(l => l.status === 'Approved').length;
      const pending = agentLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status)).length;
      const hoursTarget = 160;
      const hoursDelivered = hoursTarget - (approved * 8);
      const deficit = hoursTarget - hoursDelivered;
      return { ...agent, approved, pending, hoursTarget, hoursDelivered, deficit };
    });
  }, [users, leaves, deptId]);

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Team Summary</h1>

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(m => (
          <motion.div key={m.id} variants={staggerItem} {...cardHover} className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground tracking-label uppercase block">Leaves</span>
                <span className="font-semibold">{m.approved} taken</span>
                {m.pending > 0 && <span className="text-xs text-warning ml-1">(+{m.pending} pending)</span>}
              </div>
              <div>
                <span className="text-xs text-muted-foreground tracking-label uppercase block">Hours</span>
                <span className="font-semibold">{m.hoursDelivered}</span>
                <span className="text-xs text-muted-foreground">/{m.hoursTarget}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full accent-bar rounded-full transition-all"
                style={{ width: `${Math.min(100, (m.hoursDelivered / m.hoursTarget) * 100)}%` }}
              />
            </div>

            {m.deficit > 16 && (
              <div className="flex items-center gap-1.5 text-xs text-warning">
                <AlertTriangle size={14} />
                <span>High hours deficit ({m.deficit}h)</span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
