import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, cardHover } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { AlertTriangle, Users, TrendingUp, CheckCircle, Clock, Search } from 'lucide-react';
import { getMonthKey } from '@/core/utils/dates';

function ProgressRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  const color = pct >= 95 ? 'hsl(152, 69%, 42%)' : pct >= 80 ? 'hsl(35, 100%, 60%)' : 'hsl(0, 85%, 60%)';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full stat-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="4.5" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-extrabold font-heading">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

export default function SupervisorTeam() {
  const { users, leaves, currentUser } = useAppStore();
  const deptId = currentUser?.departmentId ?? 'd1';
  const [searchTerm, setSearchTerm] = useState('');
  const today = useMemo(() => new Date(), []);
  const currentMonthKey = getMonthKey(today);
  const nextMonthDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 1), [today]);
  const nextMonthKey = getMonthKey(nextMonthDate);
  const currentMonthLabel = today.toLocaleDateString('en-US', { month: 'long' });
  const nextMonthLabel = nextMonthDate.toLocaleDateString('en-US', { month: 'long' });
  const standardMandays = 25;
  const hoursTarget = standardMandays * 8;

  const teamMembers = useMemo(() => {
    const agents = users.filter(u => u.role === 'agent' && u.departmentId === deptId);
    return agents.map(agent => {
      const agentLeaves = leaves.filter(l => l.requesterId === agent.id);
      const currentMonthLeaves = agentLeaves.filter(l => l.date.startsWith(currentMonthKey));
      const currentMonthApproved = currentMonthLeaves.filter(l => l.status === 'Approved');
      const approved = currentMonthApproved.length;
      const approvedDays = currentMonthApproved.reduce((total, leave) => total + leave.days, 0);
      const pending = currentMonthLeaves.filter(l => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(l.status)).length;
      const rejected = agentLeaves.filter(l => l.status === 'Rejected').length;
      const mandays = standardMandays;
      const hoursDelivered = Math.max(0, hoursTarget - (approvedDays * 8));
      const deficit = hoursTarget - hoursDelivered;
      const pct = Math.min(100, (hoursDelivered / hoursTarget) * 100);
      const nextMonthPending = agentLeaves.filter(
        leave => leave.date.startsWith(nextMonthKey) && ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(leave.status),
      ).length;
      const totalCurrentMonthRequests = currentMonthLeaves.filter(leave => !['Rejected', 'Cancelled'].includes(leave.status)).length;

      return {
        ...agent,
        approved,
        pending,
        rejected,
        mandays,
        approvedDays,
        hoursTarget,
        hoursDelivered,
        deficit,
        pct,
        nextMonthPending,
        totalCurrentMonthRequests,
      };
    }).sort((a, b) => {
      if (b.deficit !== a.deficit) return b.deficit - a.deficit;
      return b.totalCurrentMonthRequests - a.totalCurrentMonthRequests;
    });
  }, [users, leaves, deptId, currentMonthKey, nextMonthKey, standardMandays, hoursTarget]);

  const filtered = searchTerm ? teamMembers.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())) : teamMembers;

  const getRiskLevel = (deficit: number) => {
    if (deficit > 24) return { label: 'Critical', color: 'bg-destructive/10 text-destructive border-destructive/15' };
    if (deficit > 16) return { label: 'High', color: 'bg-warning/10 text-warning border-warning/15' };
    if (deficit >= 1) return { label: 'At Risk', color: 'bg-info/10 text-info border-info/15' };
    return { label: 'On Track', color: 'bg-success/10 text-success border-success/15' };
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Team Management" title="Team" highlight="Summary"
        description={`${teamMembers.length} active agents sorted by highest production deficit for ${currentMonthLabel}.`}
      />

      {/* Summary Stats */}
      <div className="glass-card-featured px-6 py-4 mb-6 flex flex-wrap items-center gap-8">
        {[
          { value: teamMembers.length, label: 'Total Agents', color: 'text-foreground', icon: Users },
          { value: teamMembers.filter(m => m.deficit === 0).length, label: 'On track for production', color: 'text-success', icon: CheckCircle },
          { value: teamMembers.filter(m => m.deficit >= 1 && m.deficit <= 16).length, label: 'At risk for production', color: 'text-warning', icon: AlertTriangle },
          
          { value: teamMembers.reduce((s, m) => s + m.approved, 0), label: `Leaves taken in ${currentMonthLabel}`, color: 'text-foreground', icon: TrendingUp },
          { value: teamMembers.reduce((s, m) => s + m.nextMonthPending, 0), label: `Pending leave requests for ${nextMonthLabel}`, color: 'text-info', icon: Clock },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center border border-border/15">
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <div className={`text-xl font-extrabold font-heading ${s.color}`}>{s.value}</div>
              <div className="text-[9px] tracking-section uppercase text-muted-foreground/50 font-heading">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search agents..." className="glass-input pl-10 py-2.5 text-sm" />
        </div>
      </div>

      {/* Agent Cards */}
      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(m => {
          const risk = getRiskLevel(m.deficit);
          return (
            <motion.div key={m.id} variants={staggerItem} {...cardHover} className="glass-card gradient-border p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center border border-primary/10">
                    <span className="text-primary font-bold text-xs">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm truncate max-w-[120px]">{m.name}</div>
                    <div className="text-[9px] text-muted-foreground truncate max-w-[120px]">{m.email}</div>
                  </div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold border ${risk.color}`}>{risk.label}</span>
              </div>

              {/* Ring + Stats */}
                <div className="flex items-center gap-4">
                <ProgressRing pct={m.pct} />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {[
                    { v: m.approved, l: `${currentMonthLabel} Taken`, c: 'text-foreground' },
                    { v: m.nextMonthPending, l: `${nextMonthLabel} Pending`, c: 'text-warning' },
                    { v: `${m.mandays}d`, l: 'Mandays Plan', c: 'text-success' },
                  ].map(s => (
                    <div key={s.l} className="text-center p-2 bg-card/50 rounded-lg border border-border/10">
                      <div className={`text-base font-bold font-heading ${s.c}`}>{s.v}</div>
                      <div className="text-[7px] text-muted-foreground/50 tracking-wider uppercase font-heading">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-muted-foreground">Production Hours</span>
                  <span className="font-bold">{m.hoursDelivered}<span className="text-muted-foreground/50 font-normal">/{m.hoursTarget}</span></span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.7, delay: 0.1 }} className="h-full accent-bar rounded-full" />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  {m.deficit >= 1
                    ? `Delivered ${m.hoursDelivered} of ${m.hoursTarget} planned production hours in ${currentMonthLabel}, short by ${m.deficit} hours after ${m.approvedDays} approved leave day${m.approvedDays === 1 ? '' : 's'}.`
                    : `Delivered the full ${m.hoursTarget} planned production hours in ${currentMonthLabel}.`}
                </div>
              </div>

              {/* Deficit warning */}
              {m.deficit >= 1 && (
                <div className={`flex items-center gap-2 text-[10px] px-3 py-2 rounded-xl border ${
                  m.deficit > 16
                    ? 'text-warning bg-warning/6 border-warning/10'
                    : 'text-info bg-info/8 border-info/12'
                }`}>
                  <AlertTriangle size={12} />
                  <span className="font-semibold">
                    {m.deficit > 16
                      ? `${m.deficit} hour deficit needs attention`
                      : `${m.deficit} hour deficit keeps this guide at risk`}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
