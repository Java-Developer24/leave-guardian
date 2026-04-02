import type { WeekoffSwapRequest } from '@/core/entities';
import { formatDate, formatMonthYear } from '@/core/utils/dates';

export function getWeekoffModeLabel(request: WeekoffSwapRequest): string {
  switch (request.mode ?? 'WeekSwap') {
    case 'MonthSwap':
      return 'Swap week off';
    case 'WeekMove':
      return 'Move week off';
    default:
      return 'Swap week off in week';
  }
}

export function getWeekoffScopeLabel(request: WeekoffSwapRequest): string {
  return request.periodType === 'Month'
    ? (request.monthKey ? formatMonthYear(request.monthKey) : 'Selected month')
    : `Week of ${formatDate(request.weekStart)}`;
}

export function getWeekoffRequestDescription(
  request: WeekoffSwapRequest,
  getUserName: (id: string) => string,
): string {
  const sourceGuide = getUserName(request.sourceGuideId);
  const peerGuide = request.peerGuideId ? getUserName(request.peerGuideId) : null;

  switch (request.mode ?? 'WeekSwap') {
    case 'MonthSwap':
      return `${sourceGuide} swaps the entire ${request.monthKey ? formatMonthYear(request.monthKey) : 'selected month'} week-off pattern with ${peerGuide ?? 'the paired guide'}.`;
    case 'WeekMove':
      return `${sourceGuide} moves the week off from ${formatDate(request.sourceDate)} to ${formatDate(request.peerDate)}.`;
    default:
      return `${sourceGuide} swaps ${formatDate(request.sourceDate)} with ${peerGuide ?? 'the paired guide'} on ${formatDate(request.peerDate)}.`;
  }
}

export function getWeekoffResultSummary(
  request: WeekoffSwapRequest,
  getUserName: (id: string) => string,
): string {
  const sourceGuide = getUserName(request.sourceGuideId);
  const peerGuide = request.peerGuideId ? getUserName(request.peerGuideId) : null;

  switch (request.mode ?? 'WeekSwap') {
    case 'MonthSwap':
      return `Week off approved for ${sourceGuide} with ${peerGuide ?? 'the paired guide'} for the entire month.`;
    case 'WeekMove':
      return `Week off approved only for ${sourceGuide} by moving the off day from ${formatDate(request.sourceDate)} to ${formatDate(request.peerDate)}.`;
    default:
      return `Week off approved for ${sourceGuide} with ${peerGuide ?? 'the paired guide'} in the current week.`;
  }
}

export function getWeekoffAppliedTag(
  request: WeekoffSwapRequest,
  userId: string,
  date: string,
): 'monthSwap' | 'weekMove' | 'weekSwap' | null {
  if (request.status !== 'Approved') return null;

  switch (request.mode ?? 'WeekSwap') {
    case 'MonthSwap':
      return request.monthKey && date.startsWith(request.monthKey) && [request.sourceGuideId, request.peerGuideId].includes(userId)
        ? 'monthSwap'
        : null;
    case 'WeekMove':
      return request.sourceGuideId === userId && request.peerDate === date ? 'weekMove' : null;
    default:
      if (request.sourceGuideId === userId && request.peerDate === date) return 'weekSwap';
      if (request.peerGuideId === userId && request.sourceDate === date) return 'weekSwap';
      return null;
  }
}
