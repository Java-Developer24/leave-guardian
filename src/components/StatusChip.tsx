import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS } from '@/core/constants';

interface StatusChipProps {
  status: string;
  className?: string;
}

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const color = LEAVE_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground';
  const label = LEAVE_STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}>
      {label}
    </span>
  );
}
