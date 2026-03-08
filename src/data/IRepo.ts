import type { User, LeaveRequest, ScheduleDay, Holiday, ShrinkageRules, LeaveWindow, Attendance, Department } from '@/core/entities';

export interface IRepo {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getDepartments(): Promise<Department[]>;
  getLeavesByUser(userId: string): Promise<LeaveRequest[]>;
  getAllLeaves(): Promise<LeaveRequest[]>;
  createLeave(payload: Omit<LeaveRequest, 'id' | 'history'>): Promise<LeaveRequest>;
  updateLeave(id: string, patch: Partial<LeaveRequest>): Promise<LeaveRequest>;
  getPendingApprovals(deptId: string): Promise<LeaveRequest[]>;
  approveLeave(id: string, by: string, note?: string): Promise<LeaveRequest>;
  rejectLeave(id: string, by: string, note?: string): Promise<LeaveRequest>;
  getSchedule(deptId?: string): Promise<ScheduleDay[]>;
  uploadSchedule(rows: ScheduleDay[]): Promise<void>;
  getAttendance(): Promise<Attendance[]>;
  uploadAttendance(rows: Attendance[]): Promise<void>;
  getHolidays(): Promise<Holiday[]>;
  upsertHoliday(h: Holiday): Promise<void>;
  deleteHoliday(id: string): Promise<void>;
  getRules(): Promise<ShrinkageRules>;
  updateRules(patch: Partial<ShrinkageRules>): Promise<void>;
  getLeaveWindow(): Promise<LeaveWindow>;
  updateLeaveWindow(patch: Partial<LeaveWindow>): Promise<void>;
}
