import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/core/utils/dates';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { showToast } from '@/components/toasts/ToastContainer';
import Modal from '@/components/modals/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Inbox,
  Shield,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react';

function ShrinkageGauge({ now, after, cap }: { now: number; after: number; cap: number }) {
  const nowPct = Math.min(100, (now / (cap * 1.5)) * 100);
  const afterPct = Math.min(100, (after / (cap * 1.5)) * 100);
  const exceedsCap = after > cap;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5 text-[10px]">
        <span className="text-muted-foreground w-10">Now</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${nowPct}%` }} transition={{ duration: 0.5 }} className="h-full bg-info/50 rounded-full" />
        </div>
        <span className="font-semibold w-10 text-right">{now}%</span>
      </div>
      <div className="flex items-center gap-2.5 text-[10px]">
        <span className="text-muted-foreground w-10">After</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${afterPct}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`h-full rounded-full ${exceedsCap ? 'bg-destructive/60' : 'bg-success/60'}`}
          />
        </div>
        <span className={`font-bold w-10 text-right ${exceedsCap ? 'text-destructive' : 'text-success'}`}>{after}%</span>
      </div>
    </div>
  );
}

export default function SupervisorApprovals() {
  const [searchParams] = useSearchParams();
  const { currentUser, leaves, users, schedule, rules, holidays, repo, refreshLeaves, forecastAlerts } = useAppStore();
  const refreshForecastAlerts = useAppStore(state => state.refreshForecastAlerts);
  const deptId = currentUser?.departmentId ?? 'd1';
  const [commentModal, setCommentModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? 'all');

  const pending = useMemo(() => leaves.filter(leave => leave.departmentId === deptId && leave.status === 'PendingSupervisor'), [leaves, deptId]);
  const filteredPending = useMemo(
    () => pending.filter(leave => typeFilter === 'all' || leave.type === typeFilter),
    [pending, typeFilter],
  );
  const openForecastAlerts = useMemo(
    () => forecastAlerts.filter(alert => alert.departmentId === deptId && alert.status === 'Open').sort((a, b) => a.date.localeCompare(b.date)),
    [forecastAlerts, deptId],
  );

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;
  const getInitials = (id: string) => getUserName(id).split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();

  const getShrinkageChange = (leave: typeof pending[0]) => {
    const now = calcDailyShrinkage(leave.date, leaves, schedule);
    const afterLeaves = [...leaves, { ...leave, status: 'Approved' as const }];
    const after = calcDailyShrinkage(leave.date, afterLeaves, schedule);
    const holiday = holidays.find(item => item.date === leave.date);
    const cap = holiday?.allowedShrinkagePct ?? rules.maxDailyPct;
    return { now: parseFloat(now.toFixed(1)), after: parseFloat(after.toFixed(1)), exceedsCap: after > cap, cap };
  };

  const handleAction = async () => {
    if (!commentModal) return;

    const { id, action } = commentModal;
    if (action === 'approve') {
      await repo.approveLeave(id, currentUser!.id, comment || undefined);
      showToast('Leave approved', 'success');
    } else {
      await repo.rejectLeave(id, currentUser!.id, comment || undefined);
      showToast('Leave rejected', 'info');
    }

    await Promise.all([refreshLeaves(), refreshForecastAlerts()]);
    setCommentModal(null);
    setComment('');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Supervisor Review"
        title="Leave"
        highlight="Approvals"
        description={`${filteredPending.length} pending request${filteredPending.length !== 1 ? 's' : ''} in view and ${openForecastAlerts.length} forecast alert${openForecastAlerts.length !== 1 ? 's' : ''} for your team.`}
      />

      <div className="glass-card px-6 py-3.5 mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/12"><Shield size={15} className="text-warning" /></div>
          <div><span className="text-lg font-black font-heading">{pending.length}</span><span className="text-[10px] text-muted-foreground block">Pending</span></div>
        </div>
        <div className="w-px h-9 bg-border/20" />
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center border border-info/12"><BarChart3 size={15} className="text-info" /></div>
          <div><span className="text-lg font-black font-heading">{openForecastAlerts.length}</span><span className="text-[10px] text-muted-foreground block">Forecast Alerts</span></div>
        </div>
        <div className="w-px h-9 bg-border/20" />
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/12"><TrendingUp size={15} className="text-primary" /></div>
          <div><span className="text-[10px] text-muted-foreground">Shrinkage cap</span><span className="text-sm font-bold block">{rules.maxDailyPct}%</span></div>
        </div>
        <div className="ml-auto">
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="glass-input w-auto min-w-[150px] py-2 text-xs">
            <option value="all">All Leave Types</option>
            {['Planned', 'Unplanned', 'Swap', 'Transfer'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="bg-muted/50 border border-border mb-6">
          <TabsTrigger value="queue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Approval Queue</TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Forecast Review</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <div className="glass-card-featured overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm premium-table">
                <thead>
                  <tr>{['Guide', 'Date', 'Type', 'Reason', 'Shrinkage Impact', 'Actions'].map(header => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredPending.map((leave, index) => {
                    const shrinkage = getShrinkageChange(leave);
                    return (
                      <motion.tr key={leave.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                              {getInitials(leave.requesterId)}
                            </div>
                            <div>
                              <div className="font-semibold">{getUserName(leave.requesterId)}</div>
                              <div className="text-[10px] text-muted-foreground">Guide</div>
                            </div>
                          </div>
                        </td>
                        <td className="font-semibold">{formatDate(leave.date)}</td>
                        <td><span className="text-[10px] bg-secondary/60 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider border border-border/20">{leave.type}</span></td>
                        <td className="text-muted-foreground text-xs max-w-[180px] truncate">{leave.reason || '—'}</td>
                        <td className="min-w-[200px]">
                          <ShrinkageGauge now={shrinkage.now} after={shrinkage.after} cap={shrinkage.cap} />
                          {shrinkage.exceedsCap && (
                            <span className="flex items-center gap-1.5 text-[9px] bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-bold mt-1.5 w-fit border border-destructive/12">
                              <AlertTriangle size={9} /> Exceeds {shrinkage.cap}% cap
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => setCommentModal({ id: leave.id, action: 'approve' })} className="px-4 py-2 text-xs font-bold bg-success/8 text-success border border-success/20 rounded-xl hover:bg-success/15 hover:shadow-lg hover:shadow-success/10 transition-all flex items-center gap-1.5">
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button onClick={() => setCommentModal({ id: leave.id, action: 'reject' })} className="px-4 py-2 text-xs font-bold bg-destructive/8 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/15 hover:shadow-lg hover:shadow-destructive/10 transition-all flex items-center gap-1.5">
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredPending.length === 0 && (
                    <tr><td colSpan={6} className="p-14 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-success/6 flex items-center justify-center mx-auto mb-4 border border-success/10">
                        <CheckCircle size={28} className="text-success/30" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">All requests processed</p>
                      <p className="text-[10px] text-muted-foreground/40 mt-1">Check back later for new submissions</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border/15">
              {filteredPending.map(leave => {
                const shrinkage = getShrinkageChange(leave);
                return (
                  <div key={leave.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{getInitials(leave.requesterId)}</div>
                        <div>
                          <div className="text-sm font-semibold">{getUserName(leave.requesterId)}</div>
                          <div className="text-[10px] text-muted-foreground">{formatDate(leave.date)} • {leave.type}</div>
                        </div>
                      </div>
                    </div>
                    <ShrinkageGauge now={shrinkage.now} after={shrinkage.after} cap={shrinkage.cap} />
                    <div className="flex gap-2">
                      <button onClick={() => setCommentModal({ id: leave.id, action: 'approve' })} className="flex-1 py-2.5 text-xs font-bold bg-success/8 text-success border border-success/20 rounded-xl flex items-center justify-center gap-1.5"><CheckCircle size={12} /> Approve</button>
                      <button onClick={() => setCommentModal({ id: leave.id, action: 'reject' })} className="flex-1 py-2.5 text-xs font-bold bg-destructive/8 text-destructive border border-destructive/20 rounded-xl flex items-center justify-center gap-1.5"><XCircle size={12} /> Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="forecast">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/15">
                  <Users size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-xl font-black font-heading">{openForecastAlerts.length}</div>
                  <div className="text-[10px] text-muted-foreground">Open manager review items</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/15">
                  <AlertTriangle size={16} className="text-warning" />
                </div>
                <div>
                  <div className="text-xl font-black font-heading">{openForecastAlerts.filter(alert => alert.availableGuides < alert.requiredGuides).length}</div>
                  <div className="text-[10px] text-muted-foreground">Understaffed forecast days</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center border border-info/15">
                  <BarChart3 size={16} className="text-info" />
                </div>
                <div>
                  <div className="text-xl font-black font-heading">
                    {openForecastAlerts.length > 0 ? Math.max(...openForecastAlerts.map(alert => alert.forecastVolume)) : 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Peak forecast volume</div>
                </div>
              </div>
            </div>
          </div>

          {openForecastAlerts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-14 text-center">
              <Inbox size={26} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No manager review items right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {openForecastAlerts.map(alert => (
                <div key={alert.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{getUserName(alert.requesterId)}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{formatDate(alert.date)} • submitted {formatDate(alert.createdAt)}</div>
                    </div>
                    <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[10px] font-bold text-warning">Needs Review</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Forecast Volume</div>
                      <div className="mt-1 font-semibold">{alert.forecastVolume}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Required Guides</div>
                      <div className="mt-1 font-semibold">{alert.requiredGuides}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Scheduled Guides</div>
                      <div className="mt-1 font-semibold">{alert.scheduledGuides}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground">Available After Approval</div>
                      <div className={`mt-1 font-semibold ${alert.availableGuides < alert.requiredGuides ? 'text-destructive' : 'text-success'}`}>{alert.availableGuides}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/80 p-4">
                    <div className="text-xs text-muted-foreground">Shrinkage impact</div>
                    <div className="mt-1 text-sm font-semibold">{alert.shrinkageBefore}% to {alert.shrinkageAfter}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Modal open={!!commentModal} onClose={() => { setCommentModal(null); setComment(''); }} title={commentModal?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}>
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Add an optional comment for the guide.</p>
          <textarea value={comment} onChange={event => setComment(event.target.value)} rows={3} className="glass-input resize-none text-sm" placeholder="Optional comment..." />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setCommentModal(null); setComment(''); }} className="px-6 py-3 text-sm bg-secondary/50 rounded-2xl font-medium hover:bg-secondary/70 transition-colors">Cancel</button>
            <button onClick={handleAction} className="px-6 py-3 text-sm btn-primary-gradient text-primary-foreground rounded-2xl font-bold">Confirm</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
