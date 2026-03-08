import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import type { Attendance } from '@/core/entities';

const sampleAttendance: Attendance[] = [
  { userId: 'u1', date: '2026-03-01', present: true },
  { userId: 'u1', date: '2026-03-02', present: false, leaveType: 'Unplanned' },
  { userId: 'u2', date: '2026-03-01', present: true },
  { userId: 'u2', date: '2026-03-02', present: true },
  { userId: 'u5', date: '2026-03-01', present: true },
  { userId: 'u5', date: '2026-03-02', present: false, leaveType: 'Planned' },
  { userId: 'u6', date: '2026-03-01', present: false, leaveType: 'Unplanned' },
  { userId: 'u6', date: '2026-03-02', present: true },
  { userId: 'u7', date: '2026-03-01', present: true },
  { userId: 'u7', date: '2026-03-02', present: true },
];

export default function AdminAttendanceUpload() {
  const { repo, users } = useAppStore();
  const [preview, setPreview] = useState<Attendance[] | null>(null);
  const [saving, setSaving] = useState(false);

  const handleMockUpload = () => {
    setPreview(sampleAttendance);
    showToast('File parsed — 10 rows detected', 'info');
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    await repo.uploadAttendance(preview);
    showToast('Attendance saved successfully', 'success');
    setPreview(null);
    setSaving(false);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="DATA MANAGEMENT"
        title="Upload Weekly"
        highlight="Attendance"
        description="Upload weekly attendance records via CSV or JSON to capture actual presence data."
      />

      {!preview && (
        <div className="glass-card p-8 mb-6">
          <div className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center hover:border-primary/30 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-accent" />
            </div>
            <h3 className="font-semibold mb-1">Upload Attendance File</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Drag & drop a CSV or JSON file, or use sample data</p>
            <button onClick={handleMockUpload} className="btn-primary-gradient text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto">
              <FileSpreadsheet size={16} /> Load Sample Data
            </button>
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
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2.5 text-sm bg-secondary rounded-lg font-medium">Discard</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 text-sm btn-primary-gradient text-primary-foreground rounded-lg font-bold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/20">
                  {['User', 'Date', 'Present', 'Leave Type'].map(h => (
                    <th key={h} className="text-left p-3.5 text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-border/30 table-row-hover">
                    <td className="p-3.5 font-medium">{getUserName(row.userId)}</td>
                    <td className="p-3.5">{row.date}</td>
                    <td className="p-3.5">
                      {row.present ? (
                        <span className="flex items-center gap-1 text-success text-xs font-semibold"><CheckCircle size={13} /> Present</span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive text-xs font-semibold"><XCircle size={13} /> Absent</span>
                      )}
                    </td>
                    <td className="p-3.5 text-muted-foreground">{row.leaveType ?? '—'}</td>
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
