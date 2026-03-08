import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import AppShell from '@/components/layout/AppShell';

const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const AgentHome = lazy(() => import('@/pages/agent/AgentHome'));
const AgentSummary = lazy(() => import('@/pages/agent/AgentSummary'));
const AgentLeave = lazy(() => import('@/pages/agent/AgentLeave'));
const AgentRequests = lazy(() => import('@/pages/agent/AgentRequests'));
const SupervisorHome = lazy(() => import('@/pages/supervisor/SupervisorHome'));
const SupervisorApprovals = lazy(() => import('@/pages/supervisor/SupervisorApprovals'));
const SupervisorTeam = lazy(() => import('@/pages/supervisor/SupervisorTeam'));
const AdminScheduleUpload = lazy(() => import('@/pages/admin/uploads/AdminScheduleUpload'));
const AdminAttendanceUpload = lazy(() => import('@/pages/admin/uploads/AdminAttendanceUpload'));
const AdminLeaveWindow = lazy(() => import('@/pages/admin/config/AdminLeaveWindow'));
const AdminShrinkage = lazy(() => import('@/pages/admin/config/AdminShrinkage'));
const AdminHolidays = lazy(() => import('@/pages/admin/config/AdminHolidays'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));

function RoleGuard({ role, children }: { role: string; children: React.ReactNode }) {
  const currentUser = useAppStore(s => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <AppShell>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/agent/home" element={<RoleGuard role="agent"><AgentHome /></RoleGuard>} />
          <Route path="/agent/summary" element={<RoleGuard role="agent"><AgentSummary /></RoleGuard>} />
          <Route path="/agent/leave" element={<RoleGuard role="agent"><AgentLeave /></RoleGuard>} />
          <Route path="/agent/requests" element={<RoleGuard role="agent"><AgentRequests /></RoleGuard>} />

          <Route path="/supervisor/home" element={<RoleGuard role="supervisor"><SupervisorHome /></RoleGuard>} />
          <Route path="/supervisor/approvals" element={<RoleGuard role="supervisor"><SupervisorApprovals /></RoleGuard>} />
          <Route path="/supervisor/team" element={<RoleGuard role="supervisor"><SupervisorTeam /></RoleGuard>} />

          <Route path="/admin/uploads/schedule" element={<RoleGuard role="admin"><AdminScheduleUpload /></RoleGuard>} />
          <Route path="/admin/uploads/attendance" element={<RoleGuard role="admin"><AdminAttendanceUpload /></RoleGuard>} />
          <Route path="/admin/config/leave-window" element={<RoleGuard role="admin"><AdminLeaveWindow /></RoleGuard>} />
          <Route path="/admin/config/shrinkage" element={<RoleGuard role="admin"><AdminShrinkage /></RoleGuard>} />
          <Route path="/admin/config/holidays" element={<RoleGuard role="admin"><AdminHolidays /></RoleGuard>} />
          <Route path="/admin/analytics" element={<RoleGuard role="admin"><AdminAnalytics /></RoleGuard>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppShell>
    </Suspense>
  );
}
