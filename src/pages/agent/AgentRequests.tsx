import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function AgentRequests() {
  const { currentUser, leaves, users, repo, refreshLeaves } = useAppStore();
  const [tab, setTab] = useState<'outgoing' | 'incoming'>('outgoing');

  const outgoing = useMemo(() => leaves.filter(l => l.requesterId === currentUser?.id && (l.type === 'Swap' || l.type === 'Transfer')), [leaves, currentUser]);
  const incoming = useMemo(() => leaves.filter(l => l.peerId === currentUser?.id && l.status === 'PendingPeer'), [leaves, currentUser]);
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleAccept = async (id: string) => {
    const leave = leaves.find(l => l.id === id);
    await repo.updateLeave(id, { status: 'PendingSupervisor', history: [...(leave?.history ?? []), { at: new Date().toISOString().slice(0, 10), by: currentUser!.id, action: 'Accepted by Peer' }] });
    await refreshLeaves();
    showToast('Accepted — sent to supervisor', 'success');
  };
  const handleReject = async (id: string) => {
    const leave = leaves.find(l => l.id === id);
    await repo.updateLeave(id, { status: 'Rejected', history: [...(leave?.history ?? []), { at: new Date().toISOString().slice(0, 10), by: currentUser!.id, action: 'Rejected by Peer' }] });
    await refreshLeaves();
    showToast('Rejected', 'info');
  };

  const items = tab === 'outgoing' ? outgoing : incoming;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Swap & Transfer" title="Leave" highlight="Requests"
        description="Manage outgoing and incoming swap/transfer requests."
      />

      <div className="flex gap-1 mb-4 bg-secondary/25 rounded-xl p-1 w-fit border border-border/20">
        {(['outgoing', 'incoming'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1.5 ${tab === t ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'outgoing' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {t}
            {t === 'incoming' && incoming.length > 0 && <span className="ml-1 bg-accent text-accent-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">{incoming.length}</span>}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {items.length === 0 ? (
          <div className="py-14 text-center">
            <ArrowLeftRight size={32} className="mx-auto mb-3 text-muted-foreground/15" />
            <p className="text-muted-foreground text-xs">No {tab} requests</p>
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            {items.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 table-row-hover"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center -space-x-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary border-2 border-background z-10">{getInitials(l.requesterId)}</div>
                    {l.peerId && <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center text-[9px] font-bold text-info border-2 border-background">{getInitials(l.peerId)}</div>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs">{formatDate(l.date)}</span>
                      <span className="text-[9px] bg-secondary/50 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider border border-border/15">{l.type}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{tab === 'outgoing' ? `→ ${getUserName(l.peerId ?? '')}` : `← ${getUserName(l.requesterId)}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={l.status} />
                  {tab === 'incoming' && l.status === 'PendingPeer' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAccept(l.id)} className="px-3 py-1.5 text-[10px] font-bold bg-success/10 text-success border border-success/15 rounded-lg hover:bg-success/18 transition-all">Accept</button>
                      <button onClick={() => handleReject(l.id)} className="px-3 py-1.5 text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/15 rounded-lg hover:bg-destructive/18 transition-all">Reject</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
