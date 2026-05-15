import { mockRepo } from "@/data/mock/MockRepository";
import * as landingPageData from "@/data/pages/landingPageData";
import * as loginPageData from "@/data/pages/loginPageData";
import * as adminAnalyticsData from "@/data/pages/adminAnalyticsData";
import * as adminShrinkageData from "@/data/pages/adminShrinkageData";

/**
 * Service layer to handle all API/Data requests.
 * Currently wraps the MockRepository, but can be easily swapped for real API calls.
 */
export const apiService = {
  // Page Static Data
  getLandingPageData: async () => {
    return {
      stats: landingPageData.landingStats,
      features: landingPageData.landingFeatures,
      roles: landingPageData.landingRoles,
      capabilities: landingPageData.landingCapabilities,
      testimonials: landingPageData.landingTestimonials,
    };
  },

  getLoginPageData: async () => {
    return {
      stats: loginPageData.loginStats,
      features: loginPageData.loginFeatures,
    };
  },

  getAdminAnalyticsData: async () => {
    return adminAnalyticsData;
  },

  getAdminShrinkageData: async () => {
    return adminShrinkageData;
  },

  // Users & Auth
  getUsers: () => mockRepo.getUsers(),
  getUser: (id) => mockRepo.getUser(id),

  // Departments
  getDepartments: () => mockRepo.getDepartments(),

  // Consolidated Personas (Users + Departments)
  getPersonas: async () => {
    const [users, departments] = await Promise.all([
      mockRepo.getUsers(),
      mockRepo.getDepartments()
    ]);
    return { users, departments };
  },

  // Leaves
  getLeavesByUser: (userId) => mockRepo.getLeavesByUser(userId),
  getAllLeaves: () => mockRepo.getAllLeaves(),
  createLeave: (payload) => mockRepo.createLeave(payload),
  updateLeave: (id, patch) => mockRepo.updateLeave(id, patch),
  getPendingApprovals: (deptId) => mockRepo.getPendingApprovals(deptId),
  approveLeave: (id, by, note) => mockRepo.approveLeave(id, by, note),
  rejectLeave: (id, by, note) => mockRepo.rejectLeave(id, by, note),
  previewLeaveSubmission: (payload) => mockRepo.previewLeaveSubmission(payload),

  // Forecast & Alerts
  getForecastAlerts: (deptId) => mockRepo.getForecastAlerts(deptId),

  // Week-off Swap Requests
  getWeekoffSwapRequests: (deptId) => mockRepo.getWeekoffSwapRequests(deptId),
  createWeekoffSwapRequest: (payload) =>
    mockRepo.createWeekoffSwapRequest(payload),
  approveWeekoffSwapRequest: (id, by, note) =>
    mockRepo.approveWeekoffSwapRequest(id, by, note),
  rejectWeekoffSwapRequest: (id, by, note) =>
    mockRepo.rejectWeekoffSwapRequest(id, by, note),

  // Schedule & Attendance
  getSchedule: (deptId) => mockRepo.getSchedule(deptId),
  uploadSchedule: (rows) => mockRepo.uploadSchedule(rows),
  getAttendance: () => mockRepo.getAttendance(),
  uploadAttendance: (rows) => mockRepo.uploadAttendance(rows),

  // Holidays
  getHolidays: () => mockRepo.getHolidays(),
  upsertHoliday: (h) => mockRepo.upsertHoliday(h),
  deleteHoliday: (id) => mockRepo.deleteHoliday(id),

  // Rules & Configuration
  getRules: () => mockRepo.getRules(),
  updateRules: (patch) => mockRepo.updateRules(patch),
  getLeaveWindow: () => mockRepo.getLeaveWindow(),
  updateLeaveWindow: (patch) => mockRepo.updateLeaveWindow(patch),
};

export default apiService;
