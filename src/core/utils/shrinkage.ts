import type { LeaveRequest, ScheduleDay, ShrinkageRules, Holiday } from '@/core/entities';

export function calcDailyShrinkage(
  date: string,
  leaves: LeaveRequest[],
  schedule: ScheduleDay[]
): number {
  const scheduled = schedule.filter(s => s.date === date && !s.weekOff).length;
  if (scheduled === 0) return 0;
  const onLeave = leaves.filter(
    l => l.date === date && ['Approved', 'PendingSupervisor'].includes(l.status)
  ).length;
  return (onLeave / scheduled) * 100;
}

export function isDayBlocked(
  date: string,
  leaves: LeaveRequest[],
  schedule: ScheduleDay[],
  rules: ShrinkageRules,
  holidays: Holiday[]
): boolean {
  const holiday = holidays.find(h => h.date === date);
  const cap = holiday?.allowedShrinkagePct ?? rules.maxDailyPct;
  const current = calcDailyShrinkage(date, leaves, schedule);
  return current >= cap;
}

export function agentMonthlyCount(
  userId: string,
  month: number,
  year: number,
  leaves: LeaveRequest[]
): number {
  return leaves.filter(l => {
    const d = new Date(l.date);
    return (
      l.requesterId === userId &&
      d.getMonth() === month &&
      d.getFullYear() === year &&
      l.type === 'Planned' &&
      ['Approved', 'PendingSupervisor', 'Submitted'].includes(l.status)
    );
  }).length;
}
