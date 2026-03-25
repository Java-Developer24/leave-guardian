import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import AppShell from '@/components/layout/AppShell';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/login/LoginPage';
import AgentHome from '@/pages/agent/AgentHome';
import AgentSummary from '@/pages/agent/AgentSummary';
import AgentLeave from '@/pages/agent/AgentLeave';
import SupervisorHome from '@/pages/supervisor/SupervisorHome';
import SupervisorApprovals from '@/pages/supervisor/SupervisorApprovals';
import SupervisorTeam from '@/pages/supervisor/SupervisorTeam';
import SupervisorSchedule from '@/pages/supervisor/SupervisorSchedule';
import SupervisorAnalytics from '@/pages/supervisor/SupervisorAnalytics';
import ManagerAnalytics from '@/pages/manager/ManagerAnalytics';
import AdminScheduleUpload from '@/pages/admin/uploads/AdminScheduleUpload';
import AdminAttendanceUpload from '@/pages/admin/uploads/AdminAttendanceUpload';
import AdminConfig from '@/pages/admin/config/AdminConfig';
import AdminHolidays from '@/pages/admin/config/AdminHolidays';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminWeekoffApprovals from '@/pages/admin/AdminWeekoffApprovals';

function RoleGuard({ role, children }: { role: string; children: React.ReactNode }) {
  const currentUser = useAppStore(s => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/agent/home" element={<RoleGuard role="agent"><AgentHome /></RoleGuard>} />
        <Route path="/agent/summary" element={<RoleGuard role="agent"><AgentSummary /></RoleGuard>} />
        <Route path="/agent/leave" element={<RoleGuard role="agent"><AgentLeave /></RoleGuard>} />
        {/* <Route path="/agent/requests" element={<RoleGuard role="agent"><AgentRequests /></RoleGuard>} /> */}

        <Route path="/supervisor/home" element={<RoleGuard role="supervisor"><SupervisorHome /></RoleGuard>} />
        <Route path="/supervisor/approvals" element={<RoleGuard role="supervisor"><SupervisorApprovals /></RoleGuard>} />
        <Route path="/supervisor/team" element={<RoleGuard role="supervisor"><SupervisorTeam /></RoleGuard>} />
        <Route path="/supervisor/schedule" element={<RoleGuard role="supervisor"><SupervisorSchedule /></RoleGuard>} />
        <Route path="/supervisor/analytics" element={<RoleGuard role="supervisor"><SupervisorAnalytics /></RoleGuard>} />

        <Route path="/manager/analytics" element={<RoleGuard role="manager"><ManagerAnalytics /></RoleGuard>} />

        <Route path="/admin/uploads/schedule" element={<RoleGuard role="admin"><AdminScheduleUpload /></RoleGuard>} />
        <Route path="/admin/uploads/attendance" element={<RoleGuard role="admin"><AdminAttendanceUpload /></RoleGuard>} />
        <Route path="/admin/weekoff-swaps" element={<RoleGuard role="admin"><AdminWeekoffApprovals /></RoleGuard>} />
        <Route path="/admin/config" element={<RoleGuard role="admin"><AdminConfig /></RoleGuard>} />
        <Route path="/admin/config/holidays" element={<RoleGuard role="admin"><AdminHolidays /></RoleGuard>} />
        <Route path="/admin/analytics" element={<RoleGuard role="admin"><AdminAnalytics /></RoleGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
