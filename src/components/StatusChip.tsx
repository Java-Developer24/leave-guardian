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

const glowColors: Record<string, string> = {
  Approved: 'shadow-[0_0_8px_hsla(152,69%,42%,0.3)]',
  PendingSupervisor: 'shadow-[0_0_8px_hsla(35,100%,60%,0.3)]',
  PendingPeer: 'shadow-[0_0_8px_hsla(215,100%,58%,0.3)]',
  Rejected: 'shadow-[0_0_8px_hsla(0,85%,60%,0.3)]',
};

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const color = LEAVE_STATUS_COLORS[status] ?? 'bg-muted/40 text-muted-foreground';
  const label = LEAVE_STATUS_LABELS[status] ?? status;
  const dot = dotColors[status] ?? 'bg-muted-foreground';
  const glow = glowColors[status] ?? '';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border border-current/10 ${color} ${glow} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
