import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import StatusChip from '@/components/StatusChip';
import { Link } from 'react-router-dom';
import { Calendar, FileText, ArrowLeftRight, Clock, CheckCircle, XCircle, Send } from 'lucide-react';

export default function AgentHome() {
  const { currentUser, leaves } = useAppStore();
  const myLeaves = leaves.filter(l => l.requesterId === currentUser?.id);

  const approved = myLeaves.filter(l => l.status === 'Approved').length;
  const pending = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(l.status)).length;
  const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
  const transferred = myLeaves.filter(l => l.type === 'Transfer' || l.type === 'Swap').length;

  const pendingRequests = myLeaves.filter(l => ['PendingSupervisor', 'PendingPeer'].includes(l.status));

  return (
    <motion.div {...pageTransition}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-heading">Welcome back, {currentUser?.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Your leave overview at a glance</p>
      </div>

      <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={staggerItem}><KpiCard label="Total Leaves" value={myLeaves.length} icon={<FileText size={18} />} accent="primary" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Approved" value={approved} icon={<CheckCircle size={18} />} accent="success" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Pending" value={pending} icon={<Clock size={18} />} accent="warning" /></motion.div>
        <motion.div variants={staggerItem}><KpiCard label="Rejected" value={rejected} icon={<XCircle size={18} />} accent="primary" /></motion.div>
      </motion.div>

      {/* Pending requests */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-lg font-semibold tracking-heading mb-4">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{l.date}</span>
                    <span className="text-xs text-muted-foreground ml-2">{l.type}</span>
                  </div>
                </div>
                <StatusChip status={l.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Link to="/agent/leave" className="btn-primary-gradient text-primary-foreground font-semibold px-5 py-2.5 rounded-md flex items-center gap-2 text-sm">
          <Send size={16} /> Apply Leave
        </Link>
        <Link to="/agent/summary" className="bg-secondary text-secondary-foreground font-semibold px-5 py-2.5 rounded-md flex items-center gap-2 text-sm hover:bg-secondary/80 transition-colors">
          <FileText size={16} /> View Summary
        </Link>
        <Link to="/agent/requests" className="bg-secondary text-secondary-foreground font-semibold px-5 py-2.5 rounded-md flex items-center gap-2 text-sm hover:bg-secondary/80 transition-colors">
          <ArrowLeftRight size={16} /> Requests
        </Link>
      </div>
    </motion.div>
  );
}
