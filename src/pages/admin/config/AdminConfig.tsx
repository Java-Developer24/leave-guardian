import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Lock, Unlock, Info, BarChart3, Users, Zap } from 'lucide-react';

export default function AdminConfig() {
  const { leaveWindow, rules, repo, refreshLeaveWindow, refreshRules } = useAppStore();

  // Leave Window state
  const [open, setOpen] = useState(leaveWindow.open);
  const [startDay, setStartDay] = useState(leaveWindow.startDay);
  const [endDay, setEndDay] = useState(leaveWindow.endDay);
  const [savingWindow, setSavingWindow] = useState(false);

  // Shrinkage state
  const [maxDailyPct, setMaxDailyPct] = useState(rules.maxDailyPct);
  const [maxMonthlyPct, setMaxMonthlyPct] = useState(rules.maxMonthlyPct);
  const [agentMonthlyLeaveCap, setAgentMonthlyLeaveCap] = useState(rules.agentMonthlyLeaveCap);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    setOpen(leaveWindow.open);
    setStartDay(leaveWindow.startDay);
    setEndDay(leaveWindow.endDay);
  }, [leaveWindow]);

  useEffect(() => {
    setMaxDailyPct(rules.maxDailyPct);
    setMaxMonthlyPct(rules.maxMonthlyPct);
    setAgentMonthlyLeaveCap(rules.agentMonthlyLeaveCap);
  }, [rules]);

  const handleSaveWindow = async () => {
    if (startDay >= endDay) { showToast('Start day must be before end day', 'error'); return; }
    setSavingWindow(true);
    await repo.updateLeaveWindow({ open, startDay, endDay });
    await refreshLeaveWindow();
    showToast('Leave window updated', 'success');
    setSavingWindow(false);
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    await repo.updateRules({ maxDailyPct, maxMonthlyPct, agentMonthlyLeaveCap });
    await refreshRules();
    showToast('Shrinkage rules updated', 'success');
    setSavingRules(false);
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader tag="Admin Configuration" title="System" highlight="Configuration"
        description="Manage leave windows, shrinkage rules, and system parameters."
      />

      <Tabs defaultValue="leave-window" className="w-full">
        <TabsList className="bg-muted/50 border border-border mb-6">
          <TabsTrigger value="leave-window" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Leave Window</TabsTrigger>
          <TabsTrigger value="shrinkage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs">Shrinkage Rules</TabsTrigger>
        </TabsList>

        {/* ── Leave Window Tab ── */}
        <TabsContent value="leave-window">
          <div className="bg-card border border-border rounded-xl p-7 space-y-6 max-w-4xl">
            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${open ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                  {open ? <Unlock size={20} className="text-success" /> : <Lock size={20} className="text-destructive" />}
                </div>
                <div>
                  <div className="text-sm font-bold font-heading">Window Status</div>
                  <div className="text-xs text-muted-foreground">Currently {open ? 'accepting' : 'blocking'} applications</div>
                </div>
              </div>
              <button onClick={() => setOpen(!open)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${open ? 'bg-success' : 'bg-muted'}`}
                role="switch" aria-checked={open}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow ${open ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            {/* Day Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Start Day</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="number" min={1} max={31} value={startDay} onChange={e => setStartDay(Number(e.target.value))} className="glass-input pl-9 text-base font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">End Day</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="number" min={1} max={31} value={endDay} onChange={e => setEndDay(Number(e.target.value))} className="glass-input pl-9 text-base font-bold" />
                </div>
              </div>
            </div>

            <div className="bg-info/5 border border-info/15 rounded-xl p-4 text-xs text-muted-foreground flex gap-2.5">
              <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
              <p>Agents can apply between <strong className="text-foreground">day {startDay}</strong> and <strong className="text-foreground">day {endDay}</strong> of each month. Currently <strong className={open ? 'text-success' : 'text-destructive'}>{open ? 'open' : 'closed'}</strong>.</p>
            </div>

            <button onClick={handleSaveWindow} disabled={savingWindow} className="w-full btn-primary-gradient font-bold py-3 rounded-xl disabled:opacity-50 text-sm">
              {savingWindow ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </TabsContent>

        {/* ── Shrinkage Rules Tab ── */}
        <TabsContent value="shrinkage">
          <div className="bg-card border border-border rounded-xl p-7 max-w-4xl">
            {/* Compact Horizontal Layout */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Max Daily Shrinkage % */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-section text-muted-foreground">Daily Cap (%)</label>
                <div className="relative">
                  <BarChart3 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type="number"
                    min={0}
                    value={maxDailyPct}
                    onChange={e => setMaxDailyPct(Number(e.target.value))}
                    className="glass-input pl-7 text-lg font-bold w-full"
                  />
                </div>
              </div>

              {/* Max Monthly Shrinkage % */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-section text-muted-foreground">Monthly Cap (%)</label>
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent" />
                  <input
                    type="number"
                    min={0}
                    value={maxMonthlyPct}
                    onChange={e => setMaxMonthlyPct(Number(e.target.value))}
                    className="glass-input pl-7 text-lg font-bold w-full"
                  />
                </div>
              </div>

              {/* Agent Monthly Leave Cap */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-section text-muted-foreground">Leaves/Agent/Month</label>
                <div className="relative">
                  <Users size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-info" />
                  <input
                    type="number"
                    min={0}
                    value={agentMonthlyLeaveCap}
                    onChange={e => setAgentMonthlyLeaveCap(Number(e.target.value))}
                    className="glass-input pl-7 text-lg font-bold w-full"
                  />
                </div>
              </div>
            </div>

            <div className="bg-warning/5 border border-warning/15 rounded-xl p-4 text-xs text-muted-foreground flex gap-2.5 mb-6">
              <Zap size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <p>Changing these rules will <strong className="text-foreground">immediately</strong> update blocked dates and shrinkage calculations.</p>
            </div>

            <button onClick={handleSaveRules} disabled={savingRules} className="w-full btn-primary-gradient font-bold py-3 rounded-xl disabled:opacity-50 text-sm">
              {savingRules ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}