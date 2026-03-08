import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import { showToast } from '@/components/toasts/ToastContainer';
import Modal from '@/components/modals/Modal';
import type { Holiday, HolidayType } from '@/core/entities';
import { Plus, Pencil, Trash2, Calendar, Upload, Star, MapPin, Building2, Flag } from 'lucide-react';
import { formatDate } from '@/core/utils/dates';

const emptyHoliday: Omit<Holiday, 'id'> = { name: '', date: '', type: 'National', allowedShrinkagePct: undefined };

const typeColors: Record<string, string> = {
  National: 'bg-primary/10 text-primary border-primary/15',
  Festival: 'bg-accent/10 text-accent border-accent/15',
  Regional: 'bg-info/10 text-info border-info/15',
  Company: 'bg-success/10 text-success border-success/15',
};

const typeIcons: Record<string, typeof Flag> = {
  National: Flag, Festival: Star, Regional: MapPin, Company: Building2,
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

  const typeCounts = holidays.reduce((acc, h) => { acc[h.type] = (acc[h.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Configuration"
        title="Holiday"
        highlight="Master"
        description={`${holidays.length} holidays configured. Manage dates, types, and shrinkage overrides.`}
        action={
          <div className="flex gap-2.5">
            <button className="bg-card/80 border border-border/40 text-foreground font-medium px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-card hover:border-border/60 transition-all">
              <Upload size={15} /> Import JSON
            </button>
            <button onClick={openAdd} className="btn-primary-gradient text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <Plus size={15} /> Add Holiday
            </button>
          </div>
        }
      />

      {/* Type Summary */}
      <div className="glass-card-featured px-6 py-4 mb-6 flex flex-wrap items-center gap-6">
        {['National', 'Festival', 'Regional', 'Company'].map(type => {
          const Icon = typeIcons[type];
          return (
            <div key={type} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeColors[type]}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="text-lg font-black font-heading">{typeCounts[type] || 0}</div>
                <div className="text-[9px] tracking-section uppercase text-muted-foreground/50 font-heading">{type}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card-featured overflow-hidden">
        <table className="w-full text-sm premium-table">
          <thead>
            <tr>
              {['Holiday', 'Date', 'Type', 'Allowed Shrinkage', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holidays.map((h, i) => {
              const Icon = typeIcons[h.type] || Calendar;
              return (
                <motion.tr key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeColors[h.type]}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-semibold">{h.name}</span>
                    </div>
                  </td>
                  <td className="font-medium">{formatDate(h.date)}</td>
                  <td>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${typeColors[h.type] ?? 'bg-muted text-muted-foreground'}`}>{h.type}</span>
                  </td>
                  <td>{h.allowedShrinkagePct != null ? <span className="font-semibold">{h.allowedShrinkagePct}%</span> : <span className="text-muted-foreground/50">Default</span>}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(h)} className="p-2.5 hover:bg-card/70 rounded-xl transition-colors border border-transparent hover:border-border/20" aria-label="Edit"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(h.id)} className="p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-colors border border-transparent hover:border-destructive/15" aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {holidays.length === 0 && (
              <tr><td colSpan={5} className="p-14 text-center text-muted-foreground">No holidays configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'}>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input" placeholder="e.g. Independence Day" />
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass-input" />
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as HolidayType })} className="glass-input">
              {['National', 'Festival', 'Regional', 'Company'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-2 font-semibold font-heading">Allowed Shrinkage %</label>
            <input type="number" min={0} max={100} value={form.allowedShrinkagePct ?? ''} onChange={e => setForm({ ...form, allowedShrinkagePct: e.target.value ? Number(e.target.value) : undefined })} className="glass-input" placeholder="Uses default cap if empty" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-6 py-3 text-sm bg-secondary/50 rounded-2xl font-medium hover:bg-secondary/70 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-3 text-sm btn-primary-gradient text-primary-foreground rounded-2xl font-bold">Save</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
