import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { BarChart3, Users, Calendar } from 'lucide-react';

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

  const fields = [
    { label: 'Max Daily Shrinkage %', desc: 'Maximum percentage of team that can be on leave per day', value: maxDailyPct, set: setMaxDailyPct, icon: BarChart3 },
    { label: 'Max Monthly Shrinkage %', desc: 'Monthly shrinkage cap across the department', value: maxMonthlyPct, set: setMaxMonthlyPct, icon: Calendar },
    { label: 'Agent Monthly Leave Cap', desc: 'Maximum planned leaves per agent per month', value: agentMonthlyLeaveCap, set: setAgentMonthlyLeaveCap, icon: Users },
  ];

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="CONFIGURATION"
        title="Shrinkage"
        highlight="Rules"
        description="Configure shrinkage thresholds and leave caps. Changes immediately affect which calendar dates are blocked for agents."
      />

      <div className="glass-card accent-top-card p-6 max-w-lg space-y-6">
        {fields.map(({ label, desc, value, set, icon: Icon }) => (
          <div key={label} className="space-y-2">
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{label}</label>
            <div className="relative">
              <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="number"
                min={0}
                value={value}
                onChange={e => set(Number(e.target.value))}
                className="glass-input pl-9"
              />
            </div>
            <p className="text-[11px] text-muted-foreground/60">{desc}</p>
          </div>
        ))}

        <div className="bg-warning/5 border border-warning/15 rounded-xl p-4 text-xs text-muted-foreground">
          <p>⚡ Changing these rules will <strong className="text-foreground">immediately</strong> update blocked dates on agent calendars. No page refresh needed.</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full btn-primary-gradient text-primary-foreground font-bold py-3.5 rounded-xl disabled:opacity-50 text-sm">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}
