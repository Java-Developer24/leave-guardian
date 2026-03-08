import { describe, it, expect } from 'vitest';
import { isWithinLeaveWindow, getDaysInMonth, toDateStr } from '@/core/utils/dates';
import { calcDailyShrinkage, isDayBlocked, agentMonthlyCount } from '@/core/utils/shrinkage';
import { validateReason } from '@/core/utils/validation';

describe('dates utils', () => {
  it('isWithinLeaveWindow returns true for day within window', () => {
    expect(isWithinLeaveWindow(new Date(2026, 0, 23), { open: true, startDay: 22, endDay: 26 })).toBe(true);
  });

  it('isWithinLeaveWindow returns false when window is closed', () => {
    expect(isWithinLeaveWindow(new Date(2026, 0, 23), { open: false, startDay: 22, endDay: 26 })).toBe(false);
  });

  it('isWithinLeaveWindow returns false for day outside window', () => {
    expect(isWithinLeaveWindow(new Date(2026, 0, 10), { open: true, startDay: 22, endDay: 26 })).toBe(false);
  });

  it('getDaysInMonth returns correct count', () => {
    expect(getDaysInMonth(2026, 1).length).toBe(28); // Feb 2026
  });

  it('toDateStr formats correctly', () => {
    expect(toDateStr(new Date(2026, 0, 15))).toBe('2026-01-15');
  });
});

describe('shrinkage utils', () => {
  const schedule = [
    { userId: 'u1', date: '2026-02-01', shiftStart: '09:00', shiftEnd: '18:00', weekOff: false },
    { userId: 'u2', date: '2026-02-01', shiftStart: '09:00', shiftEnd: '18:00', weekOff: false },
  ];

  it('calcDailyShrinkage returns 0 with no leaves', () => {
    expect(calcDailyShrinkage('2026-02-01', [], schedule)).toBe(0);
  });

  it('calcDailyShrinkage returns 50% when 1 of 2 on leave', () => {
    const leaves = [{ id: 'l1', requesterId: 'u1', departmentId: 'd1', type: 'Planned' as const, date: '2026-02-01', days: 1, status: 'Approved' as const, history: [] }];
    expect(calcDailyShrinkage('2026-02-01', leaves, schedule)).toBe(50);
  });

  it('isDayBlocked when shrinkage exceeds cap', () => {
    const leaves = [{ id: 'l1', requesterId: 'u1', departmentId: 'd1', type: 'Planned' as const, date: '2026-02-01', days: 1, status: 'Approved' as const, history: [] }];
    const rules = { maxDailyPct: 10, maxMonthlyPct: 10, agentMonthlyLeaveCap: 2 };
    expect(isDayBlocked('2026-02-01', leaves, schedule, rules, [])).toBe(true);
  });

  it('agentMonthlyCount counts correct leaves', () => {
    const leaves = [
      { id: 'l1', requesterId: 'u1', departmentId: 'd1', type: 'Planned' as const, date: '2026-02-20', days: 1, status: 'Approved' as const, history: [] },
      { id: 'l2', requesterId: 'u1', departmentId: 'd1', type: 'Planned' as const, date: '2026-02-22', days: 1, status: 'PendingSupervisor' as const, history: [] },
    ];
    expect(agentMonthlyCount('u1', 1, 2026, leaves)).toBe(2);
  });
});

describe('validation utils', () => {
  it('validateReason returns error for empty', () => {
    expect(validateReason('')).toBe('Reason is required');
  });

  it('validateReason returns null for valid', () => {
    expect(validateReason('Personal work')).toBeNull();
  });

  it('validateReason returns error for too short', () => {
    expect(validateReason('ab')).toBe('Reason must be at least 3 characters');
  });
});
