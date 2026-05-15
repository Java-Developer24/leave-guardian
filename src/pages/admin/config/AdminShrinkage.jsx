import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { pageTransition } from "@/styles/motion";
import { useAppStore } from "@/state/store";
import SectionHeader from "@/components/SectionHeader";
import { showToast } from "@/components/toasts/ToastContainer";
import { Zap, Shield, Target, Users, BarChart3, Calendar } from "lucide-react";
import { apiService } from "@/services/apiService";

export default function AdminShrinkage() {
  const { rules, refreshRules } = useAppStore();
  const [maxDailyPct, setMaxDailyPct] = useState(rules.maxDailyPct);
  const [maxMonthlyPct, setMaxMonthlyPct] = useState(rules.maxMonthlyPct);
  const [agentMonthlyLeaveCap, setAgentMonthlyLeaveCap] = useState(
    rules.agentMonthlyLeaveCap,
  );
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    apiService.getAdminShrinkageData().then(setPageData);
  }, []);

  useEffect(() => {
    setMaxDailyPct(rules.maxDailyPct);
    setMaxMonthlyPct(rules.maxMonthlyPct);
    setAgentMonthlyLeaveCap(rules.agentMonthlyLeaveCap);
  }, [rules]);

  const handleSave = async () => {
    setSaving(true);
    await apiService.updateRules({
      maxDailyPct,
      maxMonthlyPct,
      agentMonthlyLeaveCap,
    });
    await refreshRules();
    showToast("Shrinkage rules updated", "success");
    setSaving(false);
  };

  if (!pageData) return null;

  const valueMap = {
    maxDailyPct: { value: maxDailyPct, set: setMaxDailyPct },
    maxMonthlyPct: { value: maxMonthlyPct, set: setMaxMonthlyPct },
    agentMonthlyLeaveCap: {
      value: agentMonthlyLeaveCap,
      set: setAgentMonthlyLeaveCap,
    },
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Configuration"
        title="Shrinkage"
        highlight="Rules"
        description="Configure shrinkage thresholds and leave caps. Changes immediately affect blocked calendar dates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card-featured accent-top-card p-8 space-y-7">
          {pageData.fields.map(({ key, label, desc, icon: Icon, accent }) => {

            return (
              <div key={label} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${pageData.accentColors[accent]}`}
                  >
                    <Icon size={18} />
                  </div>
                  <label className="block text-xs font-bold font-heading">
                    {label}
                  </label>
                </div>
                <input
                  type="number"
                  min={0}
                  value={valueMap[key].value}
                  onChange={(e) => valueMap[key].set(Number(e.target.value))}
                  className="glass-input text-xl font-bold"
                />
                <p className="text-xs text-muted-foreground/50">{desc}</p>
              </div>
            );
          })}

          <div className="bg-warning/4 border border-warning/12 rounded-2xl p-5 text-sm text-muted-foreground flex gap-3">
            <Zap size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <p>
              Changing these rules will{" "}
              <strong className="text-foreground">immediately</strong> update
              blocked dates on agent calendars and shrinkage calculations.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary-gradient text-primary-foreground font-bold py-4 rounded-2xl disabled:opacity-50 text-sm"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="glass-card gradient-border p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 mx-auto mb-4 flex items-center justify-center border border-primary/12">
              <Shield size={28} className="text-primary" />
            </div>
            <div className="text-2xl font-black font-heading gradient-text">
              {maxDailyPct}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Daily Shrinkage Cap
            </p>
          </div>
          <div className="glass-card p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/8 mx-auto mb-3 flex items-center justify-center border border-accent/12">
              <Target size={20} className="text-accent" />
            </div>
            <div className="text-2xl font-black font-heading">
              {maxMonthlyPct}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly Cap</p>
          </div>
          <div className="glass-card p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-info/8 mx-auto mb-3 flex items-center justify-center border border-info/12">
              <Users size={20} className="text-info" />
            </div>
            <div className="text-2xl font-black font-heading">
              {agentMonthlyLeaveCap}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leaves / Agent / Month
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
