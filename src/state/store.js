import { create } from "zustand";
import apiService from "@/services/apiService";

export const useAppStore = create((set, get) => ({
  service: apiService,
  currentUser: null,
  users: [],
  departments: [],
  leaves: [],
  forecastAlerts: [],
  weekoffSwapRequests: [],
  holidays: [],
  rules: { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 },
  leaveWindow: { open: true, startDay: 22, endDay: 26 },
  schedule: [],
  attendance: [],
  loading: false,

  login: async (userId) => {
    const service = get().service;
    const users = await service.getUsers();
    const user = users.find((u) => u.id === userId);
    set({ currentUser: user });
    await get().loadAll();
  },

  logout: () =>
    set({
      currentUser: null,
      users: [],
      departments: [],
      leaves: [],
      forecastAlerts: [],
      weekoffSwapRequests: [],
      holidays: [],
      schedule: [],
      attendance: [],
    }),

  loadAll: async () => {
    set({ loading: true });
    const service = get().service;
    const [
      users,
      departments,
      leaves,
      forecastAlerts,
      weekoffSwapRequests,
      holidays,
      rules,
      leaveWindow,
      schedule,
      attendance,
    ] = await Promise.all([
      service.getUsers(),
      service.getDepartments(),
      service.getAllLeaves(),
      service.getForecastAlerts(),
      service.getWeekoffSwapRequests(),
      service.getHolidays(),
      service.getRules(),
      service.getLeaveWindow(),
      service.getSchedule(),
      service.getAttendance(),
    ]);
    set({
      users,
      departments,
      leaves,
      forecastAlerts,
      weekoffSwapRequests,
      holidays,
      rules,
      leaveWindow,
      schedule,
      attendance,
      loading: false,
    });
  },

  refreshLeaves: async () => {
    const leaves = await get().service.getAllLeaves();
    set({ leaves });
  },
  refreshForecastAlerts: async () => {
    const forecastAlerts = await get().service.getForecastAlerts();
    set({ forecastAlerts });
  },
  refreshWeekoffSwapRequests: async () => {
    const weekoffSwapRequests = await get().service.getWeekoffSwapRequests();
    set({ weekoffSwapRequests });
  },
  refreshHolidays: async () => {
    const holidays = await get().service.getHolidays();
    set({ holidays });
  },
  refreshRules: async () => {
    const rules = await get().service.getRules();
    set({ rules });
  },
  refreshLeaveWindow: async () => {
    const leaveWindow = await get().service.getLeaveWindow();
    set({ leaveWindow });
  },
  refreshSchedule: async () => {
    const schedule = await get().service.getSchedule();
    set({ schedule });
  },
}));
