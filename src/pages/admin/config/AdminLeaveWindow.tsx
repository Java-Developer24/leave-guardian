import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { Calendar, Lock, Unlock, Info, Shield, Clock } from 'lucide-react';

export default function AdminLeaveWindow() {
  const { leaveWindow, repo, refreshLeaveWindow } = useAppStore();
  const [open, setOpen] = useState(leaveWindow.open);
  const [startDay, setStartDay] = useState(leaveWindow.startDay);
  const [endDay, setEndDay] = useState(leaveWindow.endDay);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOpen(leaveWindow.open);
    setStartDay(leaveWindow.startDay);
    setEndDay(leaveWindow.endDay);
  }, [leaveWindow]);

  const handleSave = async () => {
    if (startDay >= endDay) { showToast('Start day must be before end day', 'error'); return; }
    setSaving(true);
    await repo.updateLeaveWindow({ open, startDay, endDay });
    await refreshLeaveWindow();
    showToast('Leave window updated successfully', 'success');
    setSaving(false);
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Configuration"
        title="Leave Window"
        highlight="Settings"
        description="Control when agents can apply for planned leave. Changes are reflected instantly on the agent calendar."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card-featured accent-top-card p-8 space-y-7">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-5 bg-card/50 rounded-2xl border border-border/20">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${open ? 'bg-success/10 border-success/15' : 'bg-destructive/10 border-destructive/15'}`}>
                {open ? <Unlock size={22} className="text-success" /> : <Lock size={22} className="text-destructive" />}
              </div>
              <div>
                <div className="text-base font-bold font-heading">Window Status</div>
                <div className="text-xs text-muted-foreground mt-0.5">Currently {open ? 'accepting' : 'blocking'} new applications</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(!open)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${open ? 'bg-success' : 'bg-muted'}`}
              role="switch"
              aria-checked={open}
            >
              <span className={`absolute top-1 w-6 h-6 bg-foreground rounded-full transition-transform duration-300 shadow-lg ${open ? 'left-9' : 'left-1'}`} />
            </button>
          </div>

          {/* Day Range */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">Start Day</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input type="number" min={1} max={31} value={startDay} onChange={e => setStartDay(Number(e.target.value))} className="glass-input pl-11 text-lg font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">End Day</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input type="number" min={1} max={31} value={endDay} onChange={e => setEndDay(Number(e.target.value))} className="glass-input pl-11 text-lg font-bold" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-info/4 border border-info/12 rounded-2xl p-5 text-sm text-muted-foreground flex gap-3">
            <Info size={18} className="text-info flex-shrink-0 mt-0.5" />
            <p>Agents can apply between <strong className="text-foreground">day {startDay}</strong> and <strong className="text-foreground">day {endDay}</strong> of each month. Currently <strong className={open ? 'text-success' : 'text-destructive'}>{open ? 'open' : 'closed'}</strong>.</p>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full btn-primary-gradient text-primary-foreground font-bold py-4 rounded-2xl disabled:opacity-50 text-sm">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Side Info */}
        <div className="space-y-4">
          <div className="glass-card gradient-border p-6 text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border ${open ? 'bg-success/8 border-success/12' : 'bg-destructive/8 border-destructive/12'}`}>
              <Shield size={28} className={open ? 'text-success' : 'text-destructive'} />
            </div>
            <div className="text-2xl font-black font-heading">{open ? 'Open' : 'Closed'}</div>
            <p className="text-xs text-muted-foreground mt-1">Current window status</p>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold font-heading mb-3 flex items-center gap-2"><Clock size={13} className="text-accent" /> Window Range</h3>
            <div className="flex items-center justify-center gap-4 py-3">
              <div className="text-center">
                <div className="text-3xl font-black font-heading">{startDay}</div>
                <div className="text-[9px] text-muted-foreground tracking-section uppercase">Start</div>
              </div>
              <div className="text-muted-foreground/20 text-xl">→</div>
              <div className="text-center">
                <div className="text-3xl font-black font-heading">{endDay}</div>
                <div className="text-[9px] text-muted-foreground tracking-section uppercase">End</div>
              </div>
            </div>
            <div className="text-center text-[10px] text-muted-foreground mt-2">{endDay - startDay + 1} days each month</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
