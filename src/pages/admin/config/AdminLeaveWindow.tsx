import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import { showToast } from '@/components/toasts/ToastContainer';

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
    if (startDay >= endDay) {
      showToast('Start day must be before end day', 'error');
      return;
    }
    setSaving(true);
    await repo.updateLeaveWindow({ open, startDay, endDay });
    await refreshLeaveWindow();
    showToast('Leave window updated', 'success');
    setSaving(false);
  };

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Leave Window Configuration</h1>

      <div className="glass-card p-6 max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Window Status</label>
          <button
            onClick={() => setOpen(!open)}
            className={`relative w-12 h-6 rounded-full transition-colors ${open ? 'bg-success' : 'bg-muted'}`}
            role="switch"
            aria-checked={open}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-foreground rounded-full transition-transform ${open ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Start Day</label>
            <input
              type="number"
              min={1}
              max={31}
              value={startDay}
              onChange={e => setStartDay(Number(e.target.value))}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">End Day</label>
            <input
              type="number"
              min={1}
              max={31}
              value={endDay}
              onChange={e => setEndDay(Number(e.target.value))}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Agents can apply for planned leave between day {startDay} and {endDay} of each month.
          Window is currently <span className={open ? 'text-success' : 'text-destructive'}>{open ? 'open' : 'closed'}</span>.
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary-gradient text-primary-foreground font-semibold py-2.5 rounded-md disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}
