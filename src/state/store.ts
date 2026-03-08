import { create } from 'zustand';
import type { User, LeaveRequest, Holiday, ShrinkageRules, LeaveWindow, ScheduleDay, Attendance, Department } from '@/core/entities';
import type { IRepo } from '@/data/IRepo';
import { mockRepo } from '@/data/mock/MockRepository';

interface AppState {
  repo: IRepo;
  currentUser: User | null;
  users: User[];
  departments: Department[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  rules: ShrinkageRules;
  leaveWindow: LeaveWindow;
  schedule: ScheduleDay[];
  attendance: Attendance[];
  loading: boolean;

  login: (userId: string) => Promise<void>;
  logout: () => void;
  loadAll: () => Promise<void>;
  refreshLeaves: () => Promise<void>;
  refreshHolidays: () => Promise<void>;
  refreshRules: () => Promise<void>;
  refreshLeaveWindow: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  setRepo: (repo: IRepo) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  repo: mockRepo,
  currentUser: null,
  users: [],
  departments: [],
  leaves: [],
  holidays: [],
  rules: { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 },
  leaveWindow: { open: true, startDay: 22, endDay: 26 },
  schedule: [],
  attendance: [],
  loading: false,

  setRepo: (repo) => set({ repo }),

  login: async (userId) => {
    const repo = get().repo;
    const user = await repo.getUser(userId);
    if (!user) throw new Error('User not found');
    set({ currentUser: user });
    await get().loadAll();
  },

  logout: () => set({ currentUser: null, users: [], departments: [], leaves: [], holidays: [], schedule: [], attendance: [] }),

  loadAll: async () => {
    set({ loading: true });
    const repo = get().repo;
    const [users, departments, leaves, holidays, rules, leaveWindow, schedule, attendance] = await Promise.all([
      repo.getUsers(),
      repo.getDepartments(),
      repo.getAllLeaves(),
      repo.getHolidays(),
      repo.getRules(),
      repo.getLeaveWindow(),
      repo.getSchedule(),
      repo.getAttendance(),
    ]);
    set({ users, departments, leaves, holidays, rules, leaveWindow, schedule, attendance, loading: false });
  },

  refreshLeaves: async () => {
    const leaves = await get().repo.getAllLeaves();
    set({ leaves });
  },
  refreshHolidays: async () => {
    const holidays = await get().repo.getHolidays();
    set({ holidays });
  },
  refreshRules: async () => {
    const rules = await get().repo.getRules();
    set({ rules });
  },
  refreshLeaveWindow: async () => {
    const leaveWindow = await get().repo.getLeaveWindow();
    set({ leaveWindow });
  },
  refreshSchedule: async () => {
    const schedule = await get().repo.getSchedule();
    set({ schedule });
  },
}));
