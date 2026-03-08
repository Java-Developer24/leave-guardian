import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS } from '@/core/constants';

interface StatusChipProps {
  status: string;
  className?: string;
}

const dotColors: Record<string, string> = {
  Approved: 'bg-success',
  PendingSupervisor: 'bg-warning',
  PendingPeer: 'bg-info',
  Submitted: 'bg-info',
  Rejected: 'bg-destructive',
  Cancelled: 'bg-muted-foreground',
  Draft: 'bg-muted-foreground',
};

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const color = LEAVE_STATUS_COLORS[status] ?? 'bg-muted/40 text-muted-foreground';
  const label = LEAVE_STATUS_LABELS[status] ?? status;
  const dot = dotColors[status] ?? 'bg-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${color} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
