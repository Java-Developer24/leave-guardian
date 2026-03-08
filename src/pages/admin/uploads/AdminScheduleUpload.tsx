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

  const handleMockUpload = () => { setPreview(sampleSchedule); showToast('File parsed — 8 rows detected', 'info'); };
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
      <SectionHeader tag="Data Management" title="Upload Monthly" highlight="Schedule" description="Upload your team's monthly shift schedule via CSV or JSON. Preview data before saving." />

      {!preview && (
        <div className="glass-card p-10 mb-6">
          <div className="upload-zone">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5 border border-primary/10">
              <Upload size={30} className="text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2 font-heading">Upload Schedule File</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">Drag & drop a CSV or JSON file here, or use the sample data</p>
            <button onClick={handleMockUpload} className="btn-primary-gradient text-primary-foreground px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2.5 mx-auto">
              <FileSpreadsheet size={16} /> Load Sample Data
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border/20 flex items-center justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2 font-heading"><CheckCircle size={16} className="text-success" /> Preview — {preview.length} rows</h2>
              <p className="text-xs text-muted-foreground mt-1">Review data before saving</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setPreview(null)} className="px-5 py-3 text-sm bg-secondary/50 rounded-2xl font-medium hover:bg-secondary/70 transition-colors">Discard</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-3 text-sm btn-primary-gradient text-primary-foreground rounded-2xl font-bold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm premium-table">
              <thead><tr>{['User', 'Date', 'Shift Start', 'Shift End', 'Week Off'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium">{getUserName(row.userId)}</td>
                    <td>{row.date}</td>
                    <td>{row.shiftStart}</td>
                    <td>{row.shiftEnd}</td>
                    <td>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${row.weekOff ? 'bg-warning/10 text-warning border-warning/12' : 'bg-success/10 text-success border-success/12'}`}>
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
