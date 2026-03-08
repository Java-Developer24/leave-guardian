import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import { showToast } from '@/components/toasts/ToastContainer';

export default function AdminShrinkage() {
  const { rules, repo, refreshRules } = useAppStore();
  const [maxDailyPct, setMaxDailyPct] = useState(rules.maxDailyPct);
  const [maxMonthlyPct, setMaxMonthlyPct] = useState(rules.maxMonthlyPct);
  const [agentMonthlyLeaveCap, setAgentMonthlyLeaveCap] = useState(rules.agentMonthlyLeaveCap);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMaxDailyPct(rules.maxDailyPct);
    setMaxMonthlyPct(rules.maxMonthlyPct);
    setAgentMonthlyLeaveCap(rules.agentMonthlyLeaveCap);
  }, [rules]);

  const handleSave = async () => {
    setSaving(true);
    await repo.updateRules({ maxDailyPct, maxMonthlyPct, agentMonthlyLeaveCap });
    await refreshRules();
    showToast('Shrinkage rules updated', 'success');
    setSaving(false);
  };

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Shrinkage Rules</h1>

      <div className="glass-card p-6 max-w-lg space-y-5">
        {[
          { label: 'Max Daily Shrinkage %', value: maxDailyPct, set: setMaxDailyPct },
          { label: 'Max Monthly Shrinkage %', value: maxMonthlyPct, set: setMaxMonthlyPct },
          { label: 'Agent Monthly Leave Cap', value: agentMonthlyLeaveCap, set: setAgentMonthlyLeaveCap },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">{label}</label>
            <input
              type="number"
              min={0}
              value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        ))}

        <p className="text-xs text-muted-foreground">
          Changing these rules will immediately affect which calendar dates are blocked for agents.
        </p>

        <button onClick={handleSave} disabled={saving} className="w-full btn-primary-gradient text-primary-foreground font-semibold py-2.5 rounded-md disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}
