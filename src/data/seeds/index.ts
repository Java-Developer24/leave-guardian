import type { User, Department, ShrinkageRules, LeaveWindow, Holiday, ScheduleDay, Attendance, LeaveRequest } from '@/core/entities';

export const seedUsers: User[] = [
  { id: "u1", name: "Sara Johnson", email: "sara@genco.com", role: "agent", departmentId: "d1" },
  { id: "u2", name: "Alex Chen", email: "alex@genco.com", role: "agent", departmentId: "d1" },
  { id: "u3", name: "Priya Sharma", email: "priya@genco.com", role: "supervisor", departmentId: "d1" },
  { id: "u4", name: "Admin One", email: "admin@genco.com", role: "admin" },
  { id: "u5", name: "Marcus Lee", email: "marcus@genco.com", role: "agent", departmentId: "d1" },
  { id: "u6", name: "Emily Rodriguez", email: "emily@genco.com", role: "agent", departmentId: "d1" },
  { id: "u7", name: "David Kim", email: "david@genco.com", role: "agent", departmentId: "d1" },
  { id: "u8", name: "Aisha Okonkwo", email: "aisha@genco.com", role: "agent", departmentId: "d2" },
  { id: "u9", name: "Thomas Berg", email: "thomas@genco.com", role: "agent", departmentId: "d2" },
  { id: "u10", name: "Sofia Rossi", email: "sofia@genco.com", role: "supervisor", departmentId: "d2" },
];

export const seedDepartments: Department[] = [
  { id: "d1", name: "Customer Care", monthlyLeaveCap: 12 },
  { id: "d2", name: "Technical Support", monthlyLeaveCap: 10 },
];

export const seedRules: ShrinkageRules = { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 };

export const seedLeaveWindow: LeaveWindow = { open: true, startDay: 22, endDay: 26 };

export const seedHolidays: Holiday[] = [
  { id: "h1", name: "Republic Day", date: "2026-01-26", type: "National", allowedShrinkagePct: 15 },
  { id: "h2", name: "Valentine's Day", date: "2026-02-14", type: "Festival" },
  { id: "h3", name: "Holi", date: "2026-03-10", type: "Festival", allowedShrinkagePct: 15 },
  { id: "h4", name: "Good Friday", date: "2026-04-03", type: "National", allowedShrinkagePct: 12 },
  { id: "h5", name: "May Day", date: "2026-05-01", type: "National" },
  { id: "h6", name: "Independence Day", date: "2026-08-15", type: "National", allowedShrinkagePct: 15 },
  { id: "h7", name: "Gandhi Jayanti", date: "2026-10-02", type: "National" },
  { id: "h8", name: "Diwali", date: "2026-11-08", type: "Festival", allowedShrinkagePct: 20 },
  { id: "h9", name: "Christmas", date: "2026-12-25", type: "National", allowedShrinkagePct: 15 },
  { id: "h10", name: "Company Foundation Day", date: "2026-06-15", type: "Company" },
];

const generateSchedule = (): ScheduleDay[] => {
  const rows: ScheduleDay[] = [];
  const agents = ["u1", "u2", "u5", "u6", "u7", "u8", "u9"];
  const shifts = [
    { start: "09:00", end: "18:00" },
    { start: "10:00", end: "19:00" },
    { start: "08:00", end: "17:00" },
  ];
  for (let d = 1; d <= 28; d++) {
    const dateStr = `2026-02-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(2026, 1, d).getDay();
    agents.forEach((uid, i) => {
      const shift = shifts[i % shifts.length];
      rows.push({
        userId: uid,
        date: dateStr,
        shiftStart: shift.start,
        shiftEnd: shift.end,
        weekOff: dayOfWeek === 0 || (dayOfWeek === 6 && d % 2 === 0),
      });
    });
  }
  return rows;
};

export const seedSchedule: ScheduleDay[] = generateSchedule();

export const seedAttendance: Attendance[] = [
  { userId: "u1", date: "2026-02-03", present: false, leaveType: "Unplanned" },
  { userId: "u2", date: "2026-02-05", present: true },
  { userId: "u5", date: "2026-02-03", present: true },
  { userId: "u5", date: "2026-02-04", present: false, leaveType: "Planned" },
  { userId: "u6", date: "2026-02-06", present: false, leaveType: "Unplanned" },
  { userId: "u7", date: "2026-02-07", present: true },
  { userId: "u1", date: "2026-02-10", present: true },
  { userId: "u2", date: "2026-02-10", present: false, leaveType: "Unplanned" },
  { userId: "u1", date: "2026-02-12", present: true },
  { userId: "u6", date: "2026-02-12", present: false, leaveType: "Planned" },
];

export const seedLeaves: LeaveRequest[] = [
  {
    id: "l1", requesterId: "u1", departmentId: "d1", type: "Planned",
    date: "2026-02-20", days: 1, reason: "Personal work — bank visit", status: "PendingSupervisor",
    history: [{ at: "2026-01-24", by: "u1", action: "Submitted" }],
  },
  {
    id: "l2", requesterId: "u1", departmentId: "d1", type: "Swap",
    date: "2026-02-22", days: 1, peerId: "u2", reason: "Swap with Alex — family function", status: "PendingPeer",
    history: [{ at: "2026-01-24", by: "u1", action: "Submitted" }],
  },
  {
    id: "l3", requesterId: "u2", departmentId: "d1", type: "Planned",
    date: "2026-02-18", days: 1, reason: "Doctor appointment", status: "Approved",
    history: [
      { at: "2026-01-23", by: "u2", action: "Submitted" },
      { at: "2026-01-24", by: "u3", action: "Approved", note: "Approved — low shrinkage on that day" },
    ],
  },
  {
    id: "l4", requesterId: "u5", departmentId: "d1", type: "Planned",
    date: "2026-02-25", days: 1, reason: "Passport renewal", status: "PendingSupervisor",
    history: [{ at: "2026-01-25", by: "u5", action: "Submitted" }],
  },
  {
    id: "l5", requesterId: "u6", departmentId: "d1", type: "Planned",
    date: "2026-02-20", days: 1, reason: "Wedding ceremony", status: "PendingSupervisor",
    history: [{ at: "2026-01-24", by: "u6", action: "Submitted" }],
  },
  {
    id: "l6", requesterId: "u7", departmentId: "d1", type: "Transfer",
    date: "2026-02-21", days: 1, peerId: "u1", reason: "Transfer to Sara — school event", status: "PendingPeer",
    history: [{ at: "2026-01-25", by: "u7", action: "Submitted" }],
  },
  {
    id: "l7", requesterId: "u1", departmentId: "d1", type: "Planned",
    date: "2026-01-15", days: 1, reason: "Medical checkup", status: "Approved",
    history: [
      { at: "2025-12-23", by: "u1", action: "Submitted" },
      { at: "2025-12-24", by: "u3", action: "Approved" },
    ],
  },
  {
    id: "l8", requesterId: "u1", departmentId: "d1", type: "Planned",
    date: "2025-12-24", days: 1, reason: "Christmas Eve", status: "Approved",
    history: [
      { at: "2025-11-24", by: "u1", action: "Submitted" },
      { at: "2025-11-25", by: "u3", action: "Approved" },
    ],
  },
  {
    id: "l9", requesterId: "u2", departmentId: "d1", type: "Planned",
    date: "2026-01-12", days: 1, reason: "Family event", status: "Rejected",
    history: [
      { at: "2025-12-24", by: "u2", action: "Submitted" },
      { at: "2025-12-25", by: "u3", action: "Rejected", note: "High shrinkage day — try another date" },
    ],
  },
  {
    id: "l10", requesterId: "u5", departmentId: "d1", type: "Swap",
    date: "2026-02-15", days: 1, peerId: "u6", reason: "Swap with Emily", status: "Approved",
    history: [
      { at: "2026-01-22", by: "u5", action: "Submitted" },
      { at: "2026-01-22", by: "u6", action: "Accepted by Peer" },
      { at: "2026-01-23", by: "u3", action: "Approved" },
    ],
  },
  {
    id: "l11", requesterId: "u8", departmentId: "d2", type: "Planned",
    date: "2026-02-19", days: 1, reason: "Visa appointment", status: "Approved",
    history: [
      { at: "2026-01-23", by: "u8", action: "Submitted" },
      { at: "2026-01-24", by: "u10", action: "Approved" },
    ],
  },
  {
    id: "l12", requesterId: "u9", departmentId: "d2", type: "Planned",
    date: "2026-02-26", days: 1, reason: "Moving house", status: "PendingSupervisor",
    history: [{ at: "2026-01-26", by: "u9", action: "Submitted" }],
  },
];
