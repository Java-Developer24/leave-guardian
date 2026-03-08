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

  const outgoing = useMemo(() =>
    leaves.filter(l => l.requesterId === currentUser?.id && (l.type === 'Swap' || l.type === 'Transfer')),
    [leaves, currentUser]
  );
  const incoming = useMemo(() =>
    leaves.filter(l => l.peerId === currentUser?.id && l.status === 'PendingPeer'),
    [leaves, currentUser]
  );
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  const handleAccept = async (id: string) => {
    const leave = leaves.find(l => l.id === id);
    await repo.updateLeave(id, {
      status: 'PendingSupervisor',
      history: [...(leave?.history ?? []), { at: new Date().toISOString().slice(0, 10), by: currentUser!.id, action: 'Accepted by Peer' }],
    });
    await refreshLeaves();
    showToast('Request accepted — sent to supervisor', 'success');
  };

  const handleReject = async (id: string) => {
    const leave = leaves.find(l => l.id === id);
    await repo.updateLeave(id, {
      status: 'Rejected',
      history: [...(leave?.history ?? []), { at: new Date().toISOString().slice(0, 10), by: currentUser!.id, action: 'Rejected by Peer' }],
    });
    await refreshLeaves();
    showToast('Request rejected', 'info');
  };

  const items = tab === 'outgoing' ? outgoing : incoming;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="SWAP & TRANSFER"
        title="Leave"
        highlight="Requests"
        description="Manage outgoing and incoming swap/transfer requests with your peers."
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit border border-border/50">
        {(['outgoing', 'incoming'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize flex items-center gap-2 ${
              tab === t ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'outgoing' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {t}
            {t === 'incoming' && incoming.length > 0 && (
              <span className="ml-1 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">{incoming.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <ArrowLeftRight size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No {tab} requests</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {items.map(l => (
              <div key={l.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 table-row-hover">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${l.type === 'Swap' ? 'bg-info/10' : 'bg-accent/10'}`}>
                    <ArrowLeftRight size={16} className={l.type === 'Swap' ? 'text-info' : 'text-accent'} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{formatDate(l.date)}</span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-md font-medium uppercase tracking-wider text-muted-foreground">{l.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tab === 'outgoing'
                        ? `Requested with: ${getUserName(l.peerId ?? '')}`
                        : `From: ${getUserName(l.requesterId)}`
                      }
                    </p>
                    {l.reason && <p className="text-xs text-muted-foreground/70">{l.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip status={l.status} />
                  {tab === 'incoming' && l.status === 'PendingPeer' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(l.id)} className="px-4 py-2 text-xs font-semibold bg-success/15 text-success border border-success/25 rounded-lg hover:bg-success/25 transition-colors">Accept</button>
                      <button onClick={() => handleReject(l.id)} className="px-4 py-2 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/25 rounded-lg hover:bg-destructive/25 transition-colors">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
