import type { LeaveWindow } from '@/core/entities';

export function isWithinLeaveWindow(date: Date, window: LeaveWindow): boolean {
  if (!window.open) return false;
  const day = date.getDate();
  return day >= window.startDay && day <= window.endDay;
}

export function isTodayInWindowForMonth(window: LeaveWindow): boolean {
  if (!window.open) return false;
  const today = new Date();
  return today.getDate() >= window.startDay && today.getDate() <= window.endDay;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getNextMonth(): { year: number; month: number } {
  const now = new Date();
  const m = now.getMonth() + 1;
  return m > 11 ? { year: now.getFullYear() + 1, month: 0 } : { year: now.getFullYear(), month: m };
}
