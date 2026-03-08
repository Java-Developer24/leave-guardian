import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { showToast } from '@/components/toasts/ToastContainer';

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
    await repo.updateLeave(id, {
      status: 'PendingSupervisor',
      history: [...(leaves.find(l => l.id === id)?.history ?? []),
        { at: new Date().toISOString().slice(0, 10), by: currentUser!.id, action: 'Accepted by Peer' }],
    });
    await refreshLeaves();
    showToast('Request accepted', 'success');
  };

  const handleReject = async (id: string) => {
    await repo.updateLeave(id, {
      status: 'Rejected',
      history: [...(leaves.find(l => l.id === id)?.history ?? []),
        { at: new Date().toISOString().slice(0, 10), by: currentUser!.id, action: 'Rejected by Peer' }],
    });
    await refreshLeaves();
    showToast('Request rejected', 'info');
  };

  const items = tab === 'outgoing' ? outgoing : incoming;

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Swap & Transfer Requests</h1>

      <div className="flex gap-1 mb-4 bg-secondary rounded-md p-1 w-fit">
        {(['outgoing', 'incoming'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t} {t === 'incoming' && incoming.length > 0 && (
              <span className="ml-1 bg-accent text-accent-foreground text-xs px-1.5 rounded-full">{incoming.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="glass-card divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No {tab} requests</div>
        ) : items.map(l => (
          <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{formatDate(l.date)}</span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">{l.type}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {tab === 'outgoing'
                  ? `With: ${getUserName(l.peerId ?? '')}`
                  : `From: ${getUserName(l.requesterId)}`
                }
              </p>
              {l.reason && <p className="text-xs text-muted-foreground">{l.reason}</p>}
            </div>
            <div className="flex items-center gap-2">
              <StatusChip status={l.status} />
              {tab === 'incoming' && l.status === 'PendingPeer' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(l.id)} className="px-3 py-1.5 text-xs font-medium bg-success/20 text-success border border-success/30 rounded-md hover:bg-success/30 transition-colors">Accept</button>
                  <button onClick={() => handleReject(l.id)} className="px-3 py-1.5 text-xs font-medium bg-destructive/20 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/30 transition-colors">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
