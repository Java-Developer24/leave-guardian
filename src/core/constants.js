export const LEAVE_STATUS_COLORS = {
  Approved: "bg-success/15 text-success",
  PendingSupervisor: "bg-warning/15 text-warning",
  PendingPeer: "bg-info/15 text-info",
  Submitted: "bg-info/15 text-info",
  Rejected: "bg-destructive/15 text-destructive",
  Cancelled: "bg-muted/30 text-muted-foreground",
  Draft: "bg-muted/30 text-muted-foreground",
};

export const LEAVE_STATUS_LABELS = {
  PendingSupervisor: "Pending Supervisor",
  PendingPeer: "Pending Peer",
};

export const ROLE_ROUTES = {
  agent: "/agent/home",
  supervisor: "/supervisor/home",
  manager: "/manager/analytics",
  admin: "/admin/uploads/schedule",
};
