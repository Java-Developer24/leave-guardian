import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { Calendar, Lock, Unlock, Info } from 'lucide-react';

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

      <div className="glass-card accent-top-card p-8 max-w-lg space-y-7">
        <div className="flex items-center justify-between p-5 bg-secondary/25 rounded-2xl border border-border/20">
          <div className="flex items-center gap-3">
            {open ? <Unlock size={20} className="text-success" /> : <Lock size={20} className="text-destructive" />}
            <div>
              <div className="text-sm font-semibold font-heading">Window Status</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Currently {open ? 'accepting' : 'blocking'} new applications</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${open ? 'bg-success' : 'bg-muted'}`}
            role="switch"
            aria-checked={open}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-foreground rounded-full transition-transform duration-300 shadow-lg ${open ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">Start Day</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input type="number" min={1} max={31} value={startDay} onChange={e => setStartDay(Number(e.target.value))} className="glass-input pl-10" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">End Day</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input type="number" min={1} max={31} value={endDay} onChange={e => setEndDay(Number(e.target.value))} className="glass-input pl-10" />
            </div>
          </div>
        </div>

        <div className="bg-info/4 border border-info/10 rounded-2xl p-5 text-xs text-muted-foreground flex gap-3">
          <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
          <p>Agents can apply between <strong className="text-foreground">day {startDay}</strong> and <strong className="text-foreground">day {endDay}</strong> of each month. Currently <strong className={open ? 'text-success' : 'text-destructive'}>{open ? 'open' : 'closed'}</strong>.</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full btn-primary-gradient text-primary-foreground font-bold py-4 rounded-2xl disabled:opacity-50 text-sm">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}
