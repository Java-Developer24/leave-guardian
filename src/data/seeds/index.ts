import type { User, Department, ShrinkageRules, LeaveWindow, Holiday, ScheduleDay, Attendance, LeaveRequest } from '@/core/entities';

// ─── Departments ─────────────────────────────────────────────
export const seedDepartments: Department[] = [
  { id: "d1", name: "Messaging - Account Support", monthlyLeaveCap: 12 },
  { id: "d2", name: "Messaging - Email Support", monthlyLeaveCap: 10 },
  { id: "d3", name: "Messaging - General", monthlyLeaveCap: 11 },
  { id: "d4", name: "Messaging - Hosting", monthlyLeaveCap: 10 },
  { id: "d5", name: "Messaging - Sales", monthlyLeaveCap: 14 },
  { id: "d6", name: "Messaging India", monthlyLeaveCap: 15 },
  { id: "d7", name: "Messaging APAC", monthlyLeaveCap: 12 },
  { id: "d8", name: "Inbound", monthlyLeaveCap: 18 },
  { id: "d9", name: "Outbound", monthlyLeaveCap: 16 },
  { id: "d10", name: "Reseller", monthlyLeaveCap: 8 },
  { id: "d11", name: "One Pro", monthlyLeaveCap: 10 },
];

// ─── First names & last names for generating agents ──────────
const firstNames = [
  "Sara","Alex","Priya","Marcus","Emily","David","Aisha","Thomas","Sofia","Raj",
  "Liam","Olivia","Noah","Emma","James","Ava","Benjamin","Isabella","Lucas","Mia",
  "Henry","Amelia","Sebastian","Harper","Jack","Evelyn","Daniel","Abigail","Matthew","Ella",
  "Owen","Scarlett","Ryan","Grace","Nathan","Chloe","Carter","Zoe","Dylan","Lily",
  "Leo","Hannah","Jayden","Nora","Gabriel","Riley","Julian","Aria","Caleb","Layla",
  "Isaac","Penelope","Luke","Camila","Joshua","Luna","Andrew","Willow","Samuel","Emilia",
  "Christopher","Stella","Joseph","Aurora","Christian","Hazel","Ezra","Violet","Elijah","Savannah",
  "Colton","Audrey","Aaron","Brooklyn","Ian","Bella","Connor","Claire","Dominic","Skylar",
  "Jeremiah","Lucy","Adrian","Paisley","Nolan","Anna","Miles","Caroline","Asher","Genesis",
  "Robert","Aaliyah","Finn","Kennedy","Jaxon","Kinsley","Silas","Allison","Declan","Maya",
];
const lastNames = [
  "Johnson","Chen","Sharma","Lee","Rodriguez","Kim","Okonkwo","Berg","Rossi","Patel",
  "Williams","Brown","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson",
  "White","Harris","Martin","Garcia","Martinez","Robinson","Clark","Lewis","Walker","Young",
  "Allen","King","Wright","Lopez","Hill","Scott","Green","Adams","Baker","Nelson",
  "Carter","Mitchell","Perez","Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards",
];

// ─── Generate 100 agents + supervisors + admin ───────────────
const agentsPerDept: Record<string, number> = {
  d1: 10, d2: 8, d3: 9, d4: 7, d5: 11, d6: 12, d7: 9, d8: 14, d9: 12, d10: 5, d11: 6,
};

let userIdx = 0;
const generatedUsers: User[] = [];

// Supervisors (one per dept)
const supervisors: User[] = seedDepartments.map((dept, i) => ({
  id: `sup${i + 1}`,
  name: `${firstNames[i + 50]} ${lastNames[i + 30]}`,
  email: `${firstNames[i + 50].toLowerCase()}.${lastNames[i + 30].toLowerCase()}@genco.com`,
  role: 'supervisor' as const,
  departmentId: dept.id,
}));

// Agents
seedDepartments.forEach(dept => {
  const count = agentsPerDept[dept.id] || 8;
  for (let i = 0; i < count; i++) {
    const fn = firstNames[userIdx % firstNames.length];
    const ln = lastNames[(userIdx + 7) % lastNames.length];
    generatedUsers.push({
      id: `a${userIdx + 1}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${userIdx}@genco.com`,
      role: 'agent',
      departmentId: dept.id,
    });
    userIdx++;
  }
});

export const seedUsers: User[] = [
  ...generatedUsers,
  ...supervisors,
  { id: "admin1", name: "Admin One", email: "admin@genco.com", role: "admin" },
  { id: "admin2", name: "Admin Two", email: "admin2@genco.com", role: "admin" },
];

// ─── Rules & Window ──────────────────────────────────────────
export const seedRules: ShrinkageRules = { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 };
export const seedLeaveWindow: LeaveWindow = { open: true, startDay: 22, endDay: 26 };

// ─── Holidays ────────────────────────────────────────────────
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

// ─── Schedule (Feb 2026 for all agents) ──────────────────────
const generateSchedule = (): ScheduleDay[] => {
  const rows: ScheduleDay[] = [];
  const agents = generatedUsers.map(u => u.id);
  const shifts = [
    { start: "09:00", end: "18:00" },
    { start: "10:00", end: "19:00" },
    { start: "08:00", end: "17:00" },
    { start: "06:00", end: "15:00" },
    { start: "14:00", end: "23:00" },
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

// ─── Attendance (spread across agents) ───────────────────────
const generateAttendance = (): Attendance[] => {
  const rows: Attendance[] = [];
  const agents = generatedUsers.map(u => u.id);
  const dates = Array.from({ length: 20 }, (_, i) => `2026-02-${String(i + 1).padStart(2, '0')}`);
  agents.forEach((uid, idx) => {
    // Each agent gets 2-4 attendance records
    const count = 2 + (idx % 3);
    for (let i = 0; i < count; i++) {
      const date = dates[(idx * 3 + i * 7) % dates.length];
      const present = (idx + i) % 4 !== 0;
      rows.push({
        userId: uid,
        date,
        present,
        leaveType: present ? undefined : ((idx + i) % 2 === 0 ? 'Planned' : 'Unplanned'),
      });
    }
  });
  return rows;
};

export const seedAttendance: Attendance[] = generateAttendance();

// ─── Leave Requests (lots of them across all depts) ──────────
const generateLeaves = (): LeaveRequest[] => {
  const leaves: LeaveRequest[] = [];
  let leaveId = 1;
  const statuses: Array<LeaveRequest['status']> = ['PendingSupervisor', 'Approved', 'Rejected', 'PendingPeer', 'Approved', 'Approved'];
  const types: Array<LeaveRequest['type']> = ['Planned', 'Planned', 'Swap', 'Transfer', 'Planned', 'Planned'];
  const reasons = [
    "Personal work — bank visit", "Doctor appointment", "Family function", "Passport renewal",
    "Wedding ceremony", "School event", "Medical checkup", "Moving house", "Visa appointment",
    "Home repair", "Parent-teacher meeting", "Religious ceremony", "Vacation day", "Dental surgery",
    "Car service appointment", "Government office visit", "Sibling's graduation", "Home delivery",
    "Festival celebration", "Family emergency", "Court hearing", "Insurance meeting",
    "Property registration", "Child vaccination", "Airport pickup",
  ];

  generatedUsers.forEach((user, userIndex) => {
    // Each agent gets 2-5 leave requests
    const leaveCount = 2 + (userIndex % 4);
    for (let i = 0; i < leaveCount; i++) {
      const status = statuses[(userIndex + i) % statuses.length];
      const type = types[(userIndex + i) % types.length];
      const day = 5 + ((userIndex * 3 + i * 4) % 22);
      const date = `2026-02-${String(day).padStart(2, '0')}`;
      const submitDay = Math.max(1, day - 10 - (i * 2));
      const submitDate = `2026-01-${String(submitDay).padStart(2, '0')}`;

      // Find a peer in the same department for swaps/transfers
      const deptPeers = generatedUsers.filter(u => u.departmentId === user.departmentId && u.id !== user.id);
      const peer = deptPeers[(userIndex + i) % Math.max(1, deptPeers.length)];

      const history: LeaveRequest['history'] = [{ at: submitDate, by: user.id, action: 'Submitted' }];

      if (status === 'Approved') {
        const supervisor = supervisors.find(s => s.departmentId === user.departmentId);
        history.push({ at: `2026-01-${String(submitDay + 1).padStart(2, '0')}`, by: supervisor?.id ?? 'sup1', action: 'Approved', note: 'Approved — within shrinkage limits' });
      } else if (status === 'Rejected') {
        const supervisor = supervisors.find(s => s.departmentId === user.departmentId);
        history.push({ at: `2026-01-${String(submitDay + 1).padStart(2, '0')}`, by: supervisor?.id ?? 'sup1', action: 'Rejected', note: 'High shrinkage day — try another date' });
      }

      leaves.push({
        id: `l${leaveId++}`,
        requesterId: user.id,
        departmentId: user.departmentId!,
        type,
        date,
        days: 1,
        reason: reasons[(userIndex + i) % reasons.length],
        status,
        peerId: (type === 'Swap' || type === 'Transfer') ? peer?.id : undefined,
        history,
      });
    }
  });

  return leaves;
};

export const seedLeaves: LeaveRequest[] = generateLeaves();
