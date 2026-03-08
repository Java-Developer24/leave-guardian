export const LEAVE_STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-success text-success-foreground',
  PendingSupervisor: 'bg-warning text-warning-foreground',
  PendingPeer: 'bg-info text-info-foreground',
  Submitted: 'bg-info text-info-foreground',
  Rejected: 'bg-destructive text-destructive-foreground',
  Cancelled: 'bg-muted text-muted-foreground',
  Draft: 'bg-muted text-muted-foreground',
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PendingSupervisor: 'Pending Supervisor',
  PendingPeer: 'Pending Peer',
};

export const ROLE_ROUTES: Record<string, string> = {
  agent: '/agent/home',
  supervisor: '/supervisor/home',
  admin: '/admin/uploads/schedule',
};
