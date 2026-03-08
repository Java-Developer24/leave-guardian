import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import { showToast } from '@/components/toasts/ToastContainer';
import { Upload } from 'lucide-react';
import type { ScheduleDay } from '@/core/entities';

const sampleSchedule: ScheduleDay[] = [
  { userId: 'u1', date: '2026-03-01', shiftStart: '09:00', shiftEnd: '18:00', weekOff: false },
  { userId: 'u1', date: '2026-03-02', shiftStart: '09:00', shiftEnd: '18:00', weekOff: true },
  { userId: 'u2', date: '2026-03-01', shiftStart: '10:00', shiftEnd: '19:00', weekOff: false },
  { userId: 'u2', date: '2026-03-02', shiftStart: '10:00', shiftEnd: '19:00', weekOff: false },
];

export default function AdminScheduleUpload() {
  const { repo, refreshSchedule, users } = useAppStore();
  const [preview, setPreview] = useState<ScheduleDay[] | null>(null);
  const [saving, setSaving] = useState(false);

  const handleMockUpload = () => {
    setPreview(sampleSchedule);
    showToast('File parsed successfully', 'info');
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    await repo.uploadSchedule(preview);
    await refreshSchedule();
    showToast('Schedule saved', 'success');
    setPreview(null);
    setSaving(false);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Upload Monthly Schedule</h1>

      <div className="glass-card p-5 mb-6">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-sm text-muted-foreground mb-4">Upload CSV/JSON file or use mock data</p>
          <button onClick={handleMockUpload} className="btn-primary-gradient text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold">
            Load Sample Data
          </button>
        </div>
      </div>

      {preview && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Preview ({preview.length} rows)</h2>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm bg-secondary rounded-md">Discard</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm btn-primary-gradient text-primary-foreground rounded-md font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'Date', 'Shift Start', 'Shift End', 'Week Off'].map(h => (
                    <th key={h} className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-3">{getUserName(row.userId)}</td>
                    <td className="p-3">{row.date}</td>
                    <td className="p-3">{row.shiftStart}</td>
                    <td className="p-3">{row.shiftEnd}</td>
                    <td className="p-3">{row.weekOff ? 'Yes' : 'No'}</td>
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
