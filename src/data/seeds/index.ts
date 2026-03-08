import type { User, Department, ShrinkageRules, LeaveWindow, Holiday, ScheduleDay, Attendance, LeaveRequest } from '@/core/entities';

export const seedUsers: User[] = [
  { id: "u1", name: "Sara Johnson", email: "sara@genco.com", role: "agent", departmentId: "d1" },
  { id: "u2", name: "Alex Chen", email: "alex@genco.com", role: "agent", departmentId: "d1" },
  { id: "u3", name: "Priya N", email: "priya@genco.com", role: "supervisor", departmentId: "d1" },
  { id: "u4", name: "Admin One", email: "admin@genco.com", role: "admin" },
];

export const seedDepartments: Department[] = [
  { id: "d1", name: "Customer Care", monthlyLeaveCap: 12 },
];

export const seedRules: ShrinkageRules = { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 };

export const seedLeaveWindow: LeaveWindow = { open: true, startDay: 22, endDay: 26 };

export const seedHolidays: Holiday[] = [
  { id: "h1", name: "Republic Day", date: "2026-01-26", type: "National", allowedShrinkagePct: 15 },
  { id: "h2", name: "Festival X", date: "2026-02-14", type: "Festival" },
];

export const seedSchedule: ScheduleDay[] = [
  { userId: "u1", date: "2026-02-01", shiftStart: "09:00", shiftEnd: "18:00", weekOff: false },
  { userId: "u1", date: "2026-02-02", shiftStart: "09:00", shiftEnd: "18:00", weekOff: false },
  { userId: "u2", date: "2026-02-01", shiftStart: "09:00", shiftEnd: "18:00", weekOff: false },
  { userId: "u2", date: "2026-02-02", shiftStart: "09:00", shiftEnd: "18:00", weekOff: false },
];

export const seedAttendance: Attendance[] = [
  { userId: "u1", date: "2026-02-03", present: false, leaveType: "Unplanned" },
];

export const seedLeaves: LeaveRequest[] = [
  {
    id: "l1", requesterId: "u1", departmentId: "d1", type: "Planned",
    date: "2026-02-20", days: 1, reason: "Personal", status: "PendingSupervisor",
    history: [{ at: "2026-01-24", by: "u1", action: "Submitted" }],
  },
  {
    id: "l2", requesterId: "u1", departmentId: "d1", type: "Swap",
    date: "2026-02-22", days: 1, peerId: "u2", reason: "Swap with Alex", status: "PendingPeer",
    history: [{ at: "2026-01-24", by: "u1", action: "Submitted" }],
  },
];
