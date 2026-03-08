import type { IRepo } from '@/data/IRepo';

/**
 * Placeholder for future API integration.
 * Swap MockRepository → ApiRepository when backend is ready.
 * Each method will call the real REST/GraphQL endpoints.
 */
const ApiRepository: IRepo = {
  getUsers: async () => { throw new Error('Not implemented — connect API'); },
  getUser: async () => { throw new Error('Not implemented'); },
  getDepartments: async () => { throw new Error('Not implemented'); },
  getLeavesByUser: async () => { throw new Error('Not implemented'); },
  getAllLeaves: async () => { throw new Error('Not implemented'); },
  createLeave: async () => { throw new Error('Not implemented'); },
  updateLeave: async () => { throw new Error('Not implemented'); },
  getPendingApprovals: async () => { throw new Error('Not implemented'); },
  approveLeave: async () => { throw new Error('Not implemented'); },
  rejectLeave: async () => { throw new Error('Not implemented'); },
  getSchedule: async () => { throw new Error('Not implemented'); },
  uploadSchedule: async () => { throw new Error('Not implemented'); },
  getAttendance: async () => { throw new Error('Not implemented'); },
  uploadAttendance: async () => { throw new Error('Not implemented'); },
  getHolidays: async () => { throw new Error('Not implemented'); },
  upsertHoliday: async () => { throw new Error('Not implemented'); },
  deleteHoliday: async () => { throw new Error('Not implemented'); },
  getRules: async () => { throw new Error('Not implemented'); },
  updateRules: async () => { throw new Error('Not implemented'); },
  getLeaveWindow: async () => { throw new Error('Not implemented'); },
  updateLeaveWindow: async () => { throw new Error('Not implemented'); },
};

export default ApiRepository;
