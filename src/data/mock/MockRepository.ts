import type { IRepo } from '@/data/IRepo';
import type { User, LeaveRequest, ScheduleDay, Holiday, ShrinkageRules, LeaveWindow, Attendance, Department } from '@/core/entities';
import { seedUsers, seedDepartments, seedRules, seedLeaveWindow, seedHolidays, seedSchedule, seedAttendance, seedLeaves } from '@/data/seeds';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));
let idCounter = 100;

class MockRepository implements IRepo {
  private users: User[] = [...seedUsers];
  private departments: Department[] = [...seedDepartments];
  private leaves: LeaveRequest[] = [...seedLeaves];
  private schedule: ScheduleDay[] = [...seedSchedule];
  private attendance: Attendance[] = [...seedAttendance];
  private holidays: Holiday[] = [...seedHolidays];
  private rules: ShrinkageRules = { ...seedRules };
  private leaveWindow: LeaveWindow = { ...seedLeaveWindow };

  async getUsers() { await delay(); return [...this.users]; }
  async getUser(id: string) { await delay(); return this.users.find(u => u.id === id); }
  async getDepartments() { await delay(); return [...this.departments]; }

  async getLeavesByUser(userId: string) {
    await delay();
    return this.leaves.filter(l => l.requesterId === userId || l.peerId === userId);
  }

  async getAllLeaves() { await delay(); return [...this.leaves]; }

  async createLeave(payload: Omit<LeaveRequest, 'id' | 'history'>) {
    await delay();
    const leave: LeaveRequest = {
      ...payload,
      id: `l${++idCounter}`,
      history: [{ at: new Date().toISOString().slice(0, 10), by: payload.requesterId, action: 'Submitted' }],
    };
    this.leaves.push(leave);
    return { ...leave };
  }

  async updateLeave(id: string, patch: Partial<LeaveRequest>) {
    await delay();
    const idx = this.leaves.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Leave not found');
    this.leaves[idx] = { ...this.leaves[idx], ...patch };
    return { ...this.leaves[idx] };
  }

  async getPendingApprovals(deptId: string) {
    await delay();
    return this.leaves.filter(l => l.departmentId === deptId && l.status === 'PendingSupervisor');
  }

  async approveLeave(id: string, by: string, note?: string) {
    const leave = this.leaves.find(l => l.id === id);
    if (!leave) throw new Error('Not found');
    leave.status = 'Approved';
    leave.history.push({ at: new Date().toISOString().slice(0, 10), by, action: 'Approved', note });
    await delay();
    return { ...leave };
  }

  async rejectLeave(id: string, by: string, note?: string) {
    const leave = this.leaves.find(l => l.id === id);
    if (!leave) throw new Error('Not found');
    leave.status = 'Rejected';
    leave.history.push({ at: new Date().toISOString().slice(0, 10), by, action: 'Rejected', note });
    await delay();
    return { ...leave };
  }

  async getSchedule() { await delay(); return [...this.schedule]; }
  async uploadSchedule(rows: ScheduleDay[]) { await delay(); this.schedule = rows; }
  async getAttendance() { await delay(); return [...this.attendance]; }
  async uploadAttendance(rows: Attendance[]) { await delay(); this.attendance = [...this.attendance, ...rows]; }
  async getHolidays() { await delay(); return [...this.holidays]; }

  async upsertHoliday(h: Holiday) {
    await delay();
    const idx = this.holidays.findIndex(x => x.id === h.id);
    if (idx >= 0) this.holidays[idx] = h;
    else this.holidays.push(h);
  }

  async deleteHoliday(id: string) {
    await delay();
    this.holidays = this.holidays.filter(h => h.id !== id);
  }

  async getRules() { await delay(); return { ...this.rules }; }
  async updateRules(patch: Partial<ShrinkageRules>) { await delay(); this.rules = { ...this.rules, ...patch }; }
  async getLeaveWindow() { await delay(); return { ...this.leaveWindow }; }
  async updateLeaveWindow(patch: Partial<LeaveWindow>) { await delay(); this.leaveWindow = { ...this.leaveWindow, ...patch }; }
}

export const mockRepo = new MockRepository();
export default MockRepository;
