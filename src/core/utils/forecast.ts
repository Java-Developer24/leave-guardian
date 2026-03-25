import type {
  ForecastAlert,
  LeaveRequest,
  LeaveSubmissionPreview,
  ScheduleDay,
  User,
} from '@/core/entities';

const ACTIVE_LEAVE_STATUSES = ['Approved', 'PendingSupervisor', 'Submitted'];

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function estimateForecastVolume(date: string) {
  const day = new Date(`${date}T00:00:00`);
  const weekday = day.getDay();
  const dayOfMonth = day.getDate();

  return 340 + (weekday * 24) + ((dayOfMonth % 6) * 18) + (weekday === 1 ? 24 : 0);
}

export function estimateRequiredGuides(date: string) {
  return Math.max(6, Math.ceil(estimateForecastVolume(date) / 40));
}

export function countScheduledGuidesForDepartment(
  date: string,
  departmentId: string,
  schedule: ScheduleDay[],
  users: User[],
) {
  const deptUserIds = new Set(
    users
      .filter(user => user.role === 'agent' && user.departmentId === departmentId)
      .map(user => user.id),
  );

  return schedule.filter(
    row => row.date === date && deptUserIds.has(row.userId) && !row.weekOff,
  ).length;
}

export function countActiveLeavesForDepartment(
  date: string,
  departmentId: string,
  leaves: LeaveRequest[],
) {
  return leaves.filter(
    leave =>
      leave.departmentId === departmentId &&
      leave.date === date &&
      ACTIVE_LEAVE_STATUSES.includes(leave.status),
  ).length;
}

export function buildLeaveSubmissionPreview(params: {
  date: string;
  departmentId: string;
  leaves: LeaveRequest[];
  schedule: ScheduleDay[];
  users: User[];
  includeNewRequest?: boolean;
}): LeaveSubmissionPreview {
  const {
    date,
    departmentId,
    leaves,
    schedule,
    users,
    includeNewRequest = true,
  } = params;

  const scheduledGuides = countScheduledGuidesForDepartment(date, departmentId, schedule, users);
  const activeLeaves = countActiveLeavesForDepartment(date, departmentId, leaves);
  const forecastVolume = estimateForecastVolume(date);
  const requiredGuides = estimateRequiredGuides(date);
  const addedLeaves = includeNewRequest ? 1 : 0;
  const availableGuidesAfterApproval = Math.max(0, scheduledGuides - activeLeaves - addedLeaves);

  const shrinkageBefore = scheduledGuides === 0 ? 0 : (activeLeaves / scheduledGuides) * 100;
  const shrinkageAfter = scheduledGuides === 0 ? 0 : ((activeLeaves + addedLeaves) / scheduledGuides) * 100;

  return {
    date,
    forecastVolume,
    requiredGuides,
    scheduledGuides,
    availableGuidesAfterApproval,
    shrinkageBefore: round1(shrinkageBefore),
    shrinkageAfter: round1(shrinkageAfter),
    needsManagerReview: availableGuidesAfterApproval < requiredGuides,
  };
}

export function buildForecastAlert(params: {
  alertId: string;
  leave: LeaveRequest;
  preview: LeaveSubmissionPreview;
  createdAt: string;
}): ForecastAlert {
  const { alertId, leave, preview, createdAt } = params;

  return {
    id: alertId,
    leaveId: leave.id,
    requesterId: leave.requesterId,
    departmentId: leave.departmentId,
    date: leave.date,
    createdAt,
    forecastVolume: preview.forecastVolume,
    requiredGuides: preview.requiredGuides,
    scheduledGuides: preview.scheduledGuides,
    availableGuides: preview.availableGuidesAfterApproval,
    shrinkageBefore: preview.shrinkageBefore,
    shrinkageAfter: preview.shrinkageAfter,
    status: 'Open',
  };
}
