export type Role = 'agent' | 'supervisor' | 'admin' | 'manager';
export type LeaveType = 'Planned' | 'Unplanned' | 'Swap' | 'Transfer';
export type LeaveStatus = 'Draft' | 'Submitted' | 'PendingPeer' | 'PendingSupervisor' | 'Approved' | 'Rejected' | 'Cancelled';
export type HolidayType = 'National' | 'Festival' | 'Regional' | 'Company';
export type ForecastAlertStatus = 'Open' | 'Reviewed';
export type WeekoffSwapStatus = 'PendingAdmin' | 'Approved' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  monthlyLeaveCap: number;
}

export interface ScheduleDay {
  userId: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  weekOff: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  allowedShrinkagePct?: number;
}

export interface LeaveRequest {
  id: string;
  requesterId: string;
  departmentId: string;
  type: LeaveType;
  date: string;
  peerLeaveDate?: string;
  days: number;
  reason?: string;
  peerId?: string;
  status: LeaveStatus;
  history: { at: string; by: string; action: string; note?: string }[];
}

export interface LeaveSubmissionPreview {
  date: string;
  forecastVolume: number;
  requiredGuides: number;
  scheduledGuides: number;
  availableGuidesAfterApproval: number;
  shrinkageBefore: number;
  shrinkageAfter: number;
  needsManagerReview: boolean;
}

export interface ForecastAlert {
  id: string;
  leaveId: string;
  requesterId: string;
  departmentId: string;
  date: string;
  createdAt: string;
  forecastVolume: number;
  requiredGuides: number;
  scheduledGuides: number;
  availableGuides: number;
  shrinkageBefore: number;
  shrinkageAfter: number;
  status: ForecastAlertStatus;
}

export interface WeekoffSwapRequest {
  id: string;
  departmentId: string;
  requesterId: string;
  sourceGuideId: string;
  peerGuideId: string;
  sourceDate: string;
  peerDate: string;
  weekStart: string;
  status: WeekoffSwapStatus;
  comment?: string;
  history: { at: string; by: string; action: string; note?: string }[];
}

export interface Attendance {
  userId: string;
  date: string;
  present: boolean;
  leaveType?: 'Planned' | 'Unplanned';
}

export interface ShrinkageRules {
  maxDailyPct: number;
  maxMonthlyPct: number;
  agentMonthlyLeaveCap: number;
}

export interface LeaveWindow {
  open: boolean;
  startDay: number;
  endDay: number;
}
