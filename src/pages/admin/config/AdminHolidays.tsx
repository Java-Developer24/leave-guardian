import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import { showToast } from '@/components/toasts/ToastContainer';
import Modal from '@/components/modals/Modal';
import type { Holiday, HolidayType } from '@/core/entities';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyHoliday: Omit<Holiday, 'id'> = { name: '', date: '', type: 'National', allowedShrinkagePct: undefined };

export default function AdminHolidays() {
  const { holidays, repo, refreshHolidays } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<Omit<Holiday, 'id'>>(emptyHoliday);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyHoliday);
    setModalOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setForm({ name: h.name, date: h.date, type: h.type, allowedShrinkagePct: h.allowedShrinkagePct });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.date) {
      showToast('Name and date are required', 'error');
      return;
    }
    const holiday: Holiday = {
      id: editing?.id ?? `h${Date.now()}`,
      ...form,
    };
    await repo.upsertHoliday(holiday);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-heading">Holiday Master</h1>
        <button onClick={openAdd} className="btn-primary-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Holiday', 'Date', 'Type', 'Allowed %', 'Actions'].map(h => (
                <th key={h} className="text-left p-3 text-xs tracking-label uppercase text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holidays.map(h => (
              <tr key={h.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium">{h.name}</td>
                <td className="p-3">{h.date}</td>
                <td className="p-3"><span className="bg-secondary px-2 py-0.5 rounded text-xs">{h.type}</span></td>
                <td className="p-3">{h.allowedShrinkagePct != null ? `${h.allowedShrinkagePct}%` : '—'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(h)} className="p-1.5 hover:bg-secondary rounded-md transition-colors" aria-label="Edit"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(h.id)} className="p-1.5 hover:bg-destructive/20 text-destructive rounded-md transition-colors" aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No holidays configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as HolidayType })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
              {['National', 'Festival', 'Regional', 'Company'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-1 font-medium">Allowed Shrinkage %</label>
            <input type="number" min={0} max={100} value={form.allowedShrinkagePct ?? ''} onChange={e => setForm({ ...form, allowedShrinkagePct: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Default cap if empty" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm bg-secondary rounded-md">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm btn-primary-gradient text-primary-foreground rounded-md font-medium">Save</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
