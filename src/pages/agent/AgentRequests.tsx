import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight, Inbox, Zap } from 'lucide-react';

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
        description="Manage outgoing and incoming swap/transfer requests with your peers."
      />

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6 bg-card/50 backdrop-blur-xl rounded-2xl p-1.5 w-fit border border-border/25">
        {(['outgoing', 'incoming'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize flex items-center gap-2 ${tab === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-card/60'}`}
          >
            {t === 'outgoing' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {t}
            {t === 'incoming' && incoming.length > 0 && <span className="ml-1 bg-accent text-accent-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">{incoming.length}</span>}
          </button>
        ))}
      </div>

      <div className="glass-card-featured overflow-hidden">
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border border-border/15">
              <Inbox size={28} className="text-muted-foreground/20" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No {tab} requests</p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">
              {tab === 'outgoing' ? 'Submit a swap or transfer to see it here' : 'Peer requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            {items.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 table-row-hover"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center -space-x-2.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-background z-10">{getInitials(l.requesterId)}</div>
                    {l.peerId && <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-info/15 to-info/5 flex items-center justify-center text-[10px] font-bold text-info border-2 border-background">{getInitials(l.peerId)}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm">{formatDate(l.date)}</span>
                      <span className="text-[10px] bg-secondary/60 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider border border-border/20">{l.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tab === 'outgoing' ? `→ ${getUserName(l.peerId ?? '')}` : `← ${getUserName(l.requesterId)}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip status={l.status} />
                  {tab === 'incoming' && l.status === 'PendingPeer' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(l.id)} className="px-4 py-2 text-xs font-bold bg-success/10 text-success border border-success/20 rounded-xl hover:bg-success/18 hover:shadow-lg hover:shadow-success/10 transition-all">Accept</button>
                      <button onClick={() => handleReject(l.id)} className="px-4 py-2 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/18 hover:shadow-lg hover:shadow-destructive/10 transition-all">Reject</button>
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
