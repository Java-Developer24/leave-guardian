import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import { showToast } from '@/components/toasts/ToastContainer';
import { Upload } from 'lucide-react';
import type { Attendance } from '@/core/entities';

const sampleAttendance: Attendance[] = [
  { userId: 'u1', date: '2026-03-01', present: true },
  { userId: 'u1', date: '2026-03-02', present: false, leaveType: 'Unplanned' },
  { userId: 'u2', date: '2026-03-01', present: true },
  { userId: 'u2', date: '2026-03-02', present: true },
];

export default function AdminAttendanceUpload() {
  const { repo, users } = useAppStore();
  const [preview, setPreview] = useState<Attendance[] | null>(null);
  const [saving, setSaving] = useState(false);

  const handleMockUpload = () => {
    setPreview(sampleAttendance);
    showToast('File parsed successfully', 'info');
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    await repo.uploadAttendance(preview);
    showToast('Attendance saved', 'success');
    setPreview(null);
    setSaving(false);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Upload Weekly Attendance</h1>

      <div className="glass-card p-5 mb-6">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-sm text-muted-foreground mb-4">Upload CSV/JSON file or use mock data</p>
          <button onClick={handleMockUpload} className="btn-primary-gradient text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold">Load Sample Data</button>
        </div>
      </div>

      {preview && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Preview ({preview.length} rows)</h2>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm bg-secondary rounded-md">Discard</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm btn-primary-gradient text-primary-foreground rounded-md font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                {['User', 'Date', 'Present', 'Leave Type'].map(h => (
                  <th key={h} className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-3">{getUserName(row.userId)}</td>
                    <td className="p-3">{row.date}</td>
                    <td className="p-3">{row.present ? '✓' : '✗'}</td>
                    <td className="p-3 text-muted-foreground">{row.leaveType ?? '—'}</td>
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
