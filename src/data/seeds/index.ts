import type {
  User,
  Department,
  ShrinkageRules,
  LeaveWindow,
  Holiday,
  ScheduleDay,
  Attendance,
  LeaveRequest,
  ForecastAlert,
  WeekoffSwapRequest,
} from '@/core/entities';

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

const agentsPerDept: Record<string, number> = {
  d1: 12, d2: 10, d3: 11, d4: 9, d5: 13, d6: 14, d7: 11, d8: 16, d9: 14, d10: 7, d11: 8,
};

let userIdx = 0;
const generatedUsers: User[] = [];

const supervisors: User[] = seedDepartments.map((dept, i) => ({
  id: `sup${i + 1}`,
  name: `${firstNames[i + 50]} ${lastNames[i + 30]}`,
  email: `${firstNames[i + 50].toLowerCase()}.${lastNames[i + 30].toLowerCase()}@genco.com`,
  role: 'supervisor' as const,
  departmentId: dept.id,
}));

seedDepartments.forEach(dept => {
  const count = agentsPerDept[dept.id] || 10;
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
  { id: "mgr1", name: "Morgan Blake", email: "manager@genco.com", role: "manager" },
  { id: "mgr2", name: "Jordan Hayes", email: "manager2@genco.com", role: "manager" },
  { id: "admin1", name: "Admin One", email: "admin@genco.com", role: "admin" },
  { id: "admin2", name: "Admin Two", email: "admin2@genco.com", role: "admin" },
];

export const seedRules: ShrinkageRules = { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 };
export const seedLeaveWindow: LeaveWindow = { open: true, startDay: 22, endDay: 26 };

export const seedHolidays: Holiday[] = [
  { id: "h1", name: "Republic Day", date: "2026-01-26", type: "National", allowedShrinkagePct: 15 },
  { id: "h2", name: "Eid-ul-Fitr/Ramzan", date: "2026-03-10", type: "Festival", allowedShrinkagePct: 15 },
  { id: "h3", name: "Good Friday", date: "2026-03-20", type: "Festival", allowedShrinkagePct: 12 },
  { id: "h4", name: "May Day", date: "2026-05-01", type: "Company" },
  { id: "h5", name: "Telangana State Formation Day", date: "2026-06-02", type: "National", allowedShrinkagePct: 15 },
  { id: "h6", name: "Vinayaka Chavithi", date: "2026-09-14", type: "Festival" },
  { id: "h7", name: "Gandhi Jayanti", date: "2026-10-02", type: "Festival", allowedShrinkagePct: 20 },
  { id: "h8", name: "Vijayadashami/Dussehra", date: "2026-10-20", type: "National", allowedShrinkagePct: 15 },
  { id: "h9", name: "Deepavali", date: "2026-12-25", type: "Festival" },
];

// ─── Schedule ────────────────────────────────────────────────
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
  // Generate for Jan through Apr 2026
  for (let m = 0; m < 4; m++) {
    const daysInMonth = new Date(2026, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const mo = m + 1;
      const dateStr = `2026-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(2026, m, d).getDay();
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
  }
  return rows;
};

export const seedSchedule: ScheduleDay[] = generateSchedule();

// ─── Attendance ──────────────────────────────────────────────
const generateAttendance = (): Attendance[] => {
  const rows: Attendance[] = [];
  const agents = generatedUsers.map(u => u.id);
  agents.forEach((uid, idx) => {
    const count = 4 + (idx % 5);
    for (let i = 0; i < count; i++) {
      const day = 1 + ((idx * 3 + i * 5) % 28);
      const month = 1 + (i % 3);
      const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const present = (idx + i) % 5 !== 0;
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

const specialAttendance: Attendance[] = [
  { userId: 'a1', date: '2026-03-24', present: false, leaveType: 'Unplanned' },
];

export const seedAttendance: Attendance[] = [...generateAttendance(), ...specialAttendance];

// ─── Leave Requests ──────────────────────────────────────────
const generateLeaves = (): LeaveRequest[] => {
  const leaves: LeaveRequest[] = [];
  let leaveId = 1;
  const statuses: Array<LeaveRequest['status']> = [
    'PendingSupervisor', 'Approved', 'Rejected', 'PendingPeer', 'Approved', 'Approved', 'Approved', 'PendingSupervisor',
    'Approved', 'Approved', 'PendingSupervisor', 'Approved', 'Rejected', 'Approved',
  ];
  const types: Array<LeaveRequest['type']> = [
    'Planned', 'Planned', 'Swap', 'Transfer', 'Planned', 'Planned', 'Planned', 'Swap',
    'Planned', 'Transfer', 'Planned', 'Planned', 'Swap', 'Planned',
  ];
  const reasons = [
    "Personal work — bank visit", "Doctor appointment", "Family function", "Passport renewal",
    "Wedding ceremony", "School event", "Medical checkup", "Moving house", "Visa appointment",
    "Home repair", "Parent-teacher meeting", "Religious ceremony", "Vacation day", "Dental surgery",
    "Car service appointment", "Government office visit", "Sibling's graduation", "Home delivery",
    "Festival celebration", "Family emergency", "Court hearing", "Insurance meeting",
    "Property registration", "Child vaccination", "Airport pickup", "Furniture delivery",
    "Internet installation", "Marriage anniversary", "Spouse's medical appointment", "Pet emergency",
    "Annual health screening", "Plumber visit at home", "Vet appointment", "Legal consultation",
    "Bank loan paperwork", "Apartment inspection", "Gym membership renewal", "College reunion",
    "Community volunteering", "Blood donation drive", "Charity event", "Kids sports day",
  ];

  generatedUsers.forEach((user, userIndex) => {
    // Each agent gets 8-14 leave requests across Jan/Feb/Mar
    const leaveCount = 8 + (userIndex % 7);
    for (let i = 0; i < leaveCount; i++) {
      const status = statuses[(userIndex + i) % statuses.length];
      const type = types[(userIndex + i) % types.length];
      const month = 1 + (i % 3); // Jan, Feb, Mar
      const day = 2 + ((userIndex * 3 + i * 3) % 26);
      const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const submitMonth = month === 1 ? 12 : month - 1;
      const submitYear = month === 1 ? 2025 : 2026;
      const submitDay = Math.max(1, Math.min(28, day - 5 + (i * 2)));
      const submitDate = `${submitYear}-${String(submitMonth).padStart(2, '0')}-${String(submitDay).padStart(2, '0')}`;

      const deptPeers = generatedUsers.filter(u => u.departmentId === user.departmentId && u.id !== user.id);
      const peer = deptPeers[(userIndex + i) % Math.max(1, deptPeers.length)];

      const history: LeaveRequest['history'] = [{ at: submitDate, by: user.id, action: 'Submitted' }];

      if (status === 'Approved') {
        const supervisor = supervisors.find(s => s.departmentId === user.departmentId);
        const approveDay = Math.min(28, submitDay + 1);
        history.push({ at: `${submitYear}-${String(submitMonth).padStart(2, '0')}-${String(approveDay).padStart(2, '0')}`, by: supervisor?.id ?? 'sup1', action: 'Approved', note: 'Approved — within shrinkage limits' });
      } else if (status === 'Rejected') {
        const supervisor = supervisors.find(s => s.departmentId === user.departmentId);
        const rejectDay = Math.min(28, submitDay + 1);
        history.push({ at: `${submitYear}-${String(submitMonth).padStart(2, '0')}-${String(rejectDay).padStart(2, '0')}`, by: supervisor?.id ?? 'sup1', action: 'Rejected', note: 'High shrinkage day — try another date' });
      }

      leaves.push({
        id: `l${leaveId++}`,
        requesterId: user.id,
        departmentId: user.departmentId!,
        type,
        date,
        peerLeaveDate: type === 'Swap' ? peer?.id ? `2026-${String(month).padStart(2, '0')}-${String(Math.min(28, day + 1)).padStart(2, '0')}` : undefined : undefined,
        days: 1,
        reason: reasons[(userIndex + i) % reasons.length],
        status,
        peerId: (type === 'Swap' || type === 'Transfer') ? peer?.id : undefined,
        history,
      });
    }
  });

  leaves.push(
    {
      id: 'l9001',
      requesterId: 'a1',
      departmentId: 'd1',
      type: 'Planned',
      date: '2026-03-27',
      days: 1,
      reason: 'Family visit',
      status: 'Approved',
      history: [
        { at: '2026-03-22', by: 'a1', action: 'Submitted' },
        { at: '2026-03-23', by: 'sup1', action: 'Approved', note: 'Coverage available' },
      ],
    },
    {
      id: 'l9002',
      requesterId: 'a1',
      departmentId: 'd1',
      type: 'Unplanned',
      date: '2026-03-24',
      days: 1,
      reason: 'Medical consultation',
      status: 'Approved',
      history: [
        { at: '2026-03-24', by: 'a1', action: 'Submitted' },
        { at: '2026-03-24', by: 'sup1', action: 'Approved', note: 'Logged as unplanned leave' },
      ],
    },
    {
      id: 'l9003',
      requesterId: 'a2',
      departmentId: 'd1',
      type: 'Planned',
      date: '2026-03-28',
      days: 1,
      reason: 'Personal commitment',
      status: 'Approved',
      history: [
        { at: '2026-03-22', by: 'a2', action: 'Submitted' },
        { at: '2026-03-23', by: 'sup1', action: 'Approved', note: 'Approved within quota' },
      ],
    },
    {
      id: 'l9004',
      requesterId: 'a2',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-28',
      peerLeaveDate: '2026-03-27',
      days: 1,
      reason: 'Need to swap because of family travel',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-25', by: 'a2', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
    {
      id: 'l9005',
      requesterId: 'a1',
      departmentId: 'd1',
      type: 'Transfer',
      date: '2026-03-30',
      days: 1,
      reason: 'Transferred to support peer training day',
      peerId: 'a3',
      status: 'Approved',
      history: [
        { at: '2026-03-22', by: 'a1', action: 'Submitted' },
        { at: '2026-03-23', by: 'a3', action: 'Accepted by Peer' },
        { at: '2026-03-24', by: 'sup1', action: 'Approved', note: 'Transfer approved' },
      ],
    },
    {
      id: 'l9006',
      requesterId: 'a4',
      departmentId: 'd1',
      type: 'Transfer',
      date: '2026-03-31',
      days: 1,
      reason: 'Transferred for project handover',
      peerId: 'a1',
      status: 'PendingSupervisor',
      history: [
        { at: '2026-03-24', by: 'a4', action: 'Submitted' },
        { at: '2026-03-25', by: 'a1', action: 'Accepted by Peer' },
      ],
    },
    {
      id: 'l9007',
      requesterId: 'a5',
      departmentId: 'd1',
      type: 'Planned',
      date: '2026-03-26',
      days: 1,
      reason: 'Quarter-end travel',
      status: 'PendingSupervisor',
      history: [
        { at: '2026-03-24', by: 'a5', action: 'Submitted' },
      ],
    },
    {
      id: 'l9008',
      requesterId: 'a6',
      departmentId: 'd1',
      type: 'Planned',
      date: '2026-03-27',
      days: 1,
      reason: 'Family event',
      status: 'PendingSupervisor',
      history: [
        { at: '2026-03-24', by: 'a6', action: 'Submitted' },
      ],
    },
    {
      id: 'l9009',
      requesterId: 'a3',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-29',
      peerLeaveDate: '2026-03-27',
      days: 1,
      reason: 'Need to cover a family ceremony on my original leave date',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-25', by: 'a3', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
    {
      id: 'l9010',
      requesterId: 'a4',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-30',
      peerLeaveDate: '2026-03-27',
      days: 1,
      reason: 'Looking to exchange leave because of team training',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-25', by: 'a4', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
    {
      id: 'l9011',
      requesterId: 'a5',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-31',
      peerLeaveDate: '2026-03-28',
      days: 1,
      reason: 'Want to move leave around month-end coverage',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-25', by: 'a5', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
    {
      id: 'l9012',
      requesterId: 'a7',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-28',
      peerLeaveDate: '2026-03-27',
      days: 1,
      reason: 'Need a different leave date for travel booking',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-24', by: 'a7', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
    {
      id: 'l9013',
      requesterId: 'a8',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-29',
      peerLeaveDate: '2026-03-28',
      days: 1,
      reason: 'Need to align leave with childcare arrangements',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-24', by: 'a8', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
    {
      id: 'l9014',
      requesterId: 'a9',
      departmentId: 'd1',
      type: 'Swap',
      date: '2026-03-30',
      peerLeaveDate: '2026-03-27',
      days: 1,
      reason: 'Requesting swap to support a personal appointment',
      peerId: 'a1',
      status: 'PendingPeer',
      history: [
        { at: '2026-03-23', by: 'a9', action: 'Submitted', note: 'Requested swap with peer' },
      ],
    },
  );

  return leaves.filter(leave => !(leave.requesterId === 'a1' && leave.date.startsWith('2026-03')));
};

export const seedLeaves: LeaveRequest[] = generateLeaves();

export const seedForecastAlerts: ForecastAlert[] = [
  {
    id: 'fa1',
    leaveId: 'l9007',
    requesterId: 'a5',
    departmentId: 'd1',
    date: '2026-03-26',
    createdAt: '2026-03-24',
    forecastVolume: 446,
    requiredGuides: 12,
    scheduledGuides: 11,
    availableGuides: 9,
    shrinkageBefore: 9.1,
    shrinkageAfter: 18.2,
    status: 'Open',
  },
  {
    id: 'fa2',
    leaveId: 'l9008',
    requesterId: 'a6',
    departmentId: 'd1',
    date: '2026-03-27',
    createdAt: '2026-03-24',
    forecastVolume: 468,
    requiredGuides: 12,
    scheduledGuides: 11,
    availableGuides: 8,
    shrinkageBefore: 18.2,
    shrinkageAfter: 27.3,
    status: 'Open',
  },
];

export const seedWeekoffSwapRequests: WeekoffSwapRequest[] = [
  {
    id: 'ws1',
    departmentId: 'd1',
    requesterId: 'sup1',
    sourceGuideId: 'a2',
    peerGuideId: 'a3',
    sourceDate: '2026-03-30',
    peerDate: '2026-03-29',
    weekStart: '2026-03-30',
    status: 'PendingAdmin',
    comment: 'Coverage balance needed for training week.',
    history: [
      { at: '2026-03-25T08:30:00.000Z', by: 'sup1', action: 'Submitted', note: 'Coverage balance needed for training week.' },
    ],
  },
];
