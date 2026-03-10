import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Lock, Unlock, Info, Shield, Clock, BarChart3, Users, Zap, Target } from 'lucide-react';

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

  const shrinkageFields = [
    { label: 'Max Daily Shrinkage %', desc: 'Maximum percentage of team on leave per day', value: maxDailyPct, set: setMaxDailyPct, icon: BarChart3, accent: 'primary' as const },
    { label: 'Max Monthly Shrinkage %', desc: 'Monthly shrinkage cap across the department', value: maxMonthlyPct, set: setMaxMonthlyPct, icon: Calendar, accent: 'accent' as const },
    { label: 'Agent Monthly Leave Cap', desc: 'Maximum planned leaves per agent per month', value: agentMonthlyLeaveCap, set: setAgentMonthlyLeaveCap, icon: Users, accent: 'info' as const },
  ];

  const accentColors = {
    primary: 'bg-primary/10 border-primary/20 text-primary',
    accent: 'bg-accent/10 border-accent/20 text-accent',
    info: 'bg-info/10 border-info/20 text-info',
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-7 space-y-6">
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

            {/* Side Info */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center border ${open ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                  <Shield size={24} className={open ? 'text-success' : 'text-destructive'} />
                </div>
                <div className="text-xl font-extrabold font-heading">{open ? 'Open' : 'Closed'}</div>
                <p className="text-xs text-muted-foreground mt-1">Current window status</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-xs font-bold font-heading mb-3 flex items-center gap-2"><Clock size={13} className="text-accent" /> Window Range</h3>
                <div className="flex items-center justify-center gap-6 py-3">
                  <div className="text-center">
                    <div className="text-2xl font-extrabold font-heading">{startDay}</div>
                    <div className="text-[9px] text-muted-foreground tracking-section uppercase">Start</div>
                  </div>
                  <div className="text-muted-foreground text-lg">→</div>
                  <div className="text-center">
                    <div className="text-2xl font-extrabold font-heading">{endDay}</div>
                    <div className="text-[9px] text-muted-foreground tracking-section uppercase">End</div>
                  </div>
                </div>
                <div className="text-center text-[10px] text-muted-foreground mt-2">{endDay - startDay + 1} days each month</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Shrinkage Rules Tab ── */}
        <TabsContent value="shrinkage">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-7 space-y-6">
              {shrinkageFields.map(({ label, desc, value, set, icon: Icon, accent }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentColors[accent]}`}>
                      <Icon size={16} />
                    </div>
                    <label className="text-xs font-bold font-heading">{label}</label>
                  </div>
                  <input type="number" min={0} value={value} onChange={e => set(Number(e.target.value))} className="glass-input text-lg font-bold" />
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              ))}

              <div className="bg-warning/5 border border-warning/15 rounded-xl p-4 text-xs text-muted-foreground flex gap-2.5">
                <Zap size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <p>Changing these rules will <strong className="text-foreground">immediately</strong> update blocked dates and shrinkage calculations.</p>
              </div>

              <button onClick={handleSaveRules} disabled={savingRules} className="w-full btn-primary-gradient font-bold py-3 rounded-xl disabled:opacity-50 text-sm">
                {savingRules ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center border border-primary/20">
                  <Shield size={24} className="text-primary" />
                </div>
                <div className="text-xl font-extrabold font-heading text-primary">{maxDailyPct}%</div>
                <p className="text-xs text-muted-foreground mt-1">Daily Shrinkage Cap</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/10 mx-auto mb-2 flex items-center justify-center border border-accent/20">
                  <Target size={18} className="text-accent" />
                </div>
                <div className="text-xl font-extrabold font-heading">{maxMonthlyPct}%</div>
                <p className="text-xs text-muted-foreground mt-1">Monthly Cap</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-info/10 mx-auto mb-2 flex items-center justify-center border border-info/20">
                  <Users size={18} className="text-info" />
                </div>
                <div className="text-xl font-extrabold font-heading">{agentMonthlyLeaveCap}</div>
                <p className="text-xs text-muted-foreground mt-1">Leaves / Agent / Month</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}