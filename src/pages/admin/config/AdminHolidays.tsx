import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import Modal from '@/components/modals/Modal';
import type { Holiday, HolidayType } from '@/core/entities';
import { Plus, Pencil, Trash2, Calendar, Upload } from 'lucide-react';
import { formatDate } from '@/core/utils/dates';

const emptyHoliday: Omit<Holiday, 'id'> = { name: '', date: '', type: 'National', allowedShrinkagePct: undefined };

const typeColors: Record<string, string> = {
  National: 'bg-primary/15 text-primary',
  Festival: 'bg-accent/15 text-accent',
  Regional: 'bg-info/15 text-info',
  Company: 'bg-success/15 text-success',
};

export default function AdminHolidays() {
  const { holidays, repo, refreshHolidays } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<Omit<Holiday, 'id'>>(emptyHoliday);

  const openAdd = () => { setEditing(null); setForm(emptyHoliday); setModalOpen(true); };
  const openEdit = (h: Holiday) => { setEditing(h); setForm({ name: h.name, date: h.date, type: h.type, allowedShrinkagePct: h.allowedShrinkagePct }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.date) { showToast('Name and date are required', 'error'); return; }
    await repo.upsertHoliday({ id: editing?.id ?? `h${Date.now()}`, ...form });
    await refreshHolidays();
    showToast(editing ? 'Holiday updated' : 'Holiday added', 'success');
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await repo.deleteHoliday(id);
    await refreshHolidays();
    showToast('Holiday deleted', 'info');
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="CONFIGURATION"
        title="Holiday"
        highlight="Master"
        description={`${holidays.length} holidays configured. Manage dates, types, and allowed shrinkage overrides.`}
        action={
          <div className="flex gap-2">
            <button className="bg-secondary/60 border border-border text-foreground font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-secondary transition-colors">
              <Upload size={15} /> Import JSON
            </button>
            <button onClick={openAdd} className="btn-primary-gradient text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <Plus size={15} /> Add Holiday
            </button>
          </div>
        }
      />

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/20">
              {['Holiday', 'Date', 'Type', 'Allowed Shrinkage', 'Actions'].map(h => (
                <th key={h} className="text-left p-4 text-[10px] tracking-section uppercase text-muted-foreground font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holidays.map(h => (
              <tr key={h.id} className="border-t border-border/30 table-row-hover">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Calendar size={16} className="text-accent" />
                    </div>
                    <span className="font-semibold">{h.name}</span>
                  </div>
                </td>
                <td className="p-4 font-medium">{formatDate(h.date)}</td>
                <td className="p-4">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${typeColors[h.type] ?? 'bg-muted text-muted-foreground'}`}>{h.type}</span>
                </td>
                <td className="p-4">{h.allowedShrinkagePct != null ? <span className="font-semibold">{h.allowedShrinkagePct}%</span> : <span className="text-muted-foreground">Default</span>}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(h)} className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label="Edit"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(h.id)} className="p-2 hover:bg-destructive/15 text-destructive rounded-lg transition-colors" aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No holidays configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'}>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input" placeholder="e.g. Independence Day" />
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass-input" />
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as HolidayType })} className="glass-input">
              {['National', 'Festival', 'Regional', 'Company'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold">Allowed Shrinkage %</label>
            <input type="number" min={0} max={100} value={form.allowedShrinkagePct ?? ''} onChange={e => setForm({ ...form, allowedShrinkagePct: e.target.value ? Number(e.target.value) : undefined })} className="glass-input" placeholder="Uses default cap if empty" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm bg-secondary rounded-lg font-medium">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2.5 text-sm btn-primary-gradient text-primary-foreground rounded-lg font-bold">Save</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
