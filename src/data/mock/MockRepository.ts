import type { IRepo } from '@/data/IRepo';
import type {
  User,
  LeaveRequest,
  ScheduleDay,
  Holiday,
  ShrinkageRules,
  LeaveWindow,
  Attendance,
  Department,
  ForecastAlert,
  WeekoffSwapRequest,
} from '@/core/entities';
import {
  seedUsers,
  seedDepartments,
  seedRules,
  seedLeaveWindow,
  seedHolidays,
  seedSchedule,
  seedAttendance,
  seedLeaves,
  seedForecastAlerts,
  seedWeekoffSwapRequests,
} from '@/data/seeds';
import { buildForecastAlert, buildLeaveSubmissionPreview } from '@/core/utils/forecast';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));
let idCounter = 100;
let alertCounter = 100;
let weekoffSwapCounter = 100;

class MockRepository implements IRepo {
  private users: User[] = [...seedUsers];
  private departments: Department[] = [...seedDepartments];
  private leaves: LeaveRequest[] = [...seedLeaves];
  private forecastAlerts: ForecastAlert[] = [...seedForecastAlerts];
  private weekoffSwapRequests: WeekoffSwapRequest[] = [...seedWeekoffSwapRequests];
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

  async previewLeaveSubmission(payload: { requesterId: string; departmentId: string; dates: string[] }) {
    await delay();
    return payload.dates.map(date =>
      buildLeaveSubmissionPreview({
        date,
        departmentId: payload.departmentId,
        leaves: this.leaves,
        schedule: this.schedule,
        users: this.users,
      }),
    );
  }

  async createLeave(payload: Omit<LeaveRequest, 'id' | 'history'>) {
    await delay();
    const submittedAt = new Date().toISOString();
    const leave: LeaveRequest = {
      ...payload,
      id: `l${++idCounter}`,
      history: [{ at: submittedAt, by: payload.requesterId, action: 'Submitted' }],
    };
    this.leaves.push(leave);
    this.syncForecastAlertForLeave(leave, submittedAt);
    return { ...leave };
  }

  async updateLeave(id: string, patch: Partial<LeaveRequest>) {
    await delay();
    const idx = this.leaves.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Leave not found');
    this.leaves[idx] = { ...this.leaves[idx], ...patch };
    if (['Rejected', 'Cancelled', 'Approved'].includes(this.leaves[idx].status)) {
      this.markForecastAlertReviewed(id);
    } else {
      this.syncForecastAlertForLeave(this.leaves[idx], this.leaves[idx].history[0]?.at ?? new Date().toISOString());
    }
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
    leave.history.push({ at: new Date().toISOString(), by, action: 'Approved', note });
    this.markForecastAlertReviewed(id);
    await delay();
    return { ...leave };
  }

  async rejectLeave(id: string, by: string, note?: string) {
    const leave = this.leaves.find(l => l.id === id);
    if (!leave) throw new Error('Not found');
    leave.status = 'Rejected';
    leave.history.push({ at: new Date().toISOString(), by, action: 'Rejected', note });
    this.markForecastAlertReviewed(id);
    await delay();
    return { ...leave };
  }

  async getForecastAlerts(deptId?: string) {
    await delay();
    return deptId
      ? this.forecastAlerts.filter(alert => alert.departmentId === deptId).map(alert => ({ ...alert }))
      : this.forecastAlerts.map(alert => ({ ...alert }));
  }

  async getWeekoffSwapRequests(deptId?: string) {
    await delay();
    return deptId
      ? this.weekoffSwapRequests.filter(request => request.departmentId === deptId).map(request => ({ ...request, history: [...request.history] }))
      : this.weekoffSwapRequests.map(request => ({ ...request, history: [...request.history] }));
  }

  async createWeekoffSwapRequest(payload: Omit<WeekoffSwapRequest, 'id' | 'status' | 'history'> & { comment?: string }) {
    await delay();
    const submittedAt = new Date().toISOString();
    const request: WeekoffSwapRequest = {
      ...payload,
      id: `ws${++weekoffSwapCounter}`,
      status: 'PendingAdmin',
      history: [{ at: submittedAt, by: payload.requesterId, action: 'Submitted', note: payload.comment }],
    };
    this.weekoffSwapRequests.unshift(request);
    return { ...request, history: [...request.history] };
  }

  async approveWeekoffSwapRequest(id: string, by: string, note?: string) {
    const request = this.weekoffSwapRequests.find(item => item.id === id);
    if (!request) throw new Error('Week-off swap request not found');
    request.status = 'Approved';
    request.history.push({ at: new Date().toISOString(), by, action: 'Approved', note });
    this.applyWeekoffSwapToSchedule(request);
    await delay();
    return { ...request, history: [...request.history] };
  }

  async rejectWeekoffSwapRequest(id: string, by: string, note?: string) {
    const request = this.weekoffSwapRequests.find(item => item.id === id);
    if (!request) throw new Error('Week-off swap request not found');
    request.status = 'Rejected';
    request.history.push({ at: new Date().toISOString(), by, action: 'Rejected', note });
    await delay();
    return { ...request, history: [...request.history] };
  }

  async getSchedule(_deptId?: string) { await delay(); return [...this.schedule]; }
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

  private syncForecastAlertForLeave(leave: LeaveRequest, createdAt: string) {
    if (!['Planned', 'Unplanned'].includes(leave.type) || !['PendingSupervisor', 'Submitted', 'Approved'].includes(leave.status)) {
      return;
    }

    const preview = buildLeaveSubmissionPreview({
      date: leave.date,
      departmentId: leave.departmentId,
      leaves: this.leaves,
      schedule: this.schedule,
      users: this.users,
      includeNewRequest: false,
    });

    const existingIndex = this.forecastAlerts.findIndex(alert => alert.leaveId === leave.id);

    if (!preview.needsManagerReview) {
      if (existingIndex >= 0) this.forecastAlerts.splice(existingIndex, 1);
      return;
    }

    const alert = buildForecastAlert({
      alertId: existingIndex >= 0 ? this.forecastAlerts[existingIndex].id : `fa${++alertCounter}`,
      leave,
      preview,
      createdAt,
    });

    if (existingIndex >= 0) this.forecastAlerts[existingIndex] = alert;
    else this.forecastAlerts.unshift(alert);
  }

  private markForecastAlertReviewed(leaveId: string) {
    const alert = this.forecastAlerts.find(item => item.leaveId === leaveId);
    if (alert) alert.status = 'Reviewed';
  }

  private applyWeekoffSwapToSchedule(request: WeekoffSwapRequest) {
    const sourceOwnDay = this.schedule.find(row => row.userId === request.sourceGuideId && row.date === request.sourceDate);
    const sourcePeerDay = this.schedule.find(row => row.userId === request.sourceGuideId && row.date === request.peerDate);
    const peerOwnDay = this.schedule.find(row => row.userId === request.peerGuideId && row.date === request.peerDate);
    const peerSourceDay = this.schedule.find(row => row.userId === request.peerGuideId && row.date === request.sourceDate);

    if (sourceOwnDay) sourceOwnDay.weekOff = false;
    if (sourcePeerDay) sourcePeerDay.weekOff = true;
    if (peerOwnDay) peerOwnDay.weekOff = false;
    if (peerSourceDay) peerSourceDay.weekOff = true;
  }
}

export const mockRepo = new MockRepository();
export default MockRepository;
