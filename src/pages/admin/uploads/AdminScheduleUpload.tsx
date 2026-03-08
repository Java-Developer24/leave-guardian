import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import type { ScheduleDay } from '@/core/entities';

const sampleSchedule: ScheduleDay[] = [
  { userId: 'u1', date: '2026-03-01', shiftStart: '09:00', shiftEnd: '18:00', weekOff: false },
  { userId: 'u1', date: '2026-03-02', shiftStart: '09:00', shiftEnd: '18:00', weekOff: true },
  { userId: 'u2', date: '2026-03-01', shiftStart: '10:00', shiftEnd: '19:00', weekOff: false },
  { userId: 'u2', date: '2026-03-02', shiftStart: '10:00', shiftEnd: '19:00', weekOff: false },
  { userId: 'u5', date: '2026-03-01', shiftStart: '08:00', shiftEnd: '17:00', weekOff: false },
  { userId: 'u5', date: '2026-03-02', shiftStart: '08:00', shiftEnd: '17:00', weekOff: true },
  { userId: 'u6', date: '2026-03-01', shiftStart: '09:00', shiftEnd: '18:00', weekOff: false },
  { userId: 'u7', date: '2026-03-01', shiftStart: '10:00', shiftEnd: '19:00', weekOff: false },
];

export default function AdminScheduleUpload() {
  const { repo, refreshSchedule, users } = useAppStore();
  const [preview, setPreview] = useState<ScheduleDay[] | null>(null);
  const [saving, setSaving] = useState(false);

  const handleMockUpload = () => {
    setPreview(sampleSchedule);
    showToast('File parsed — 8 rows detected', 'info');
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    await repo.uploadSchedule(preview);
    await refreshSchedule();
    showToast('Schedule saved successfully', 'success');
    setPreview(null);
    setSaving(false);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="DATA MANAGEMENT"
        title="Upload Monthly"
        highlight="Schedule"
        description="Upload your team's monthly shift schedule via CSV or JSON. Preview data before saving."
      />

      {!preview && (
        <div className="glass-card p-8 mb-6">
          <div className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center hover:border-primary/30 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Upload Schedule File</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Drag & drop a CSV or JSON file here, or use the sample data below</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleMockUpload} className="btn-primary-gradient text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet size={16} /> Load Sample Data
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                Preview — {preview.length} rows
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review data before saving</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2.5 text-sm bg-secondary rounded-lg font-medium hover:bg-secondary/80 transition-colors">Discard</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 text-sm btn-primary-gradient text-primary-foreground rounded-lg font-bold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/20">
                  {['User', 'Date', 'Shift Start', 'Shift End', 'Week Off'].map(h => (
                    <th key={h} className="text-left p-3.5 text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-border/30 table-row-hover">
                    <td className="p-3.5 font-medium">{getUserName(row.userId)}</td>
                    <td className="p-3.5">{row.date}</td>
                    <td className="p-3.5">{row.shiftStart}</td>
                    <td className="p-3.5">{row.shiftEnd}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${row.weekOff ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                        {row.weekOff ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
