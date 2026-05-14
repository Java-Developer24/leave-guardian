import { formatDate, formatMonthYear } from "@/core/utils/dates";

export function getWeekoffModeLabel(request) {
  switch (request.mode ?? "WeekSwap") {
    case "MonthSwap":
      return "Swap week off";
    case "WeekMove":
      return "Move week off";
    default:
      return "Swap week off in week";
  }
}

export function getWeekoffScopeLabel(request) {
  return request.periodType === "Month"
    ? request.monthKey
      ? formatMonthYear(request.monthKey)
      : "Selected month"
    : `Week of ${formatDate(request.weekStart)}`;
}

export function getWeekoffRequestDescription(request, getUserName) {
  const sourceGuide = getUserName(request.sourceGuideId);
  const peerGuide = request.peerGuideId
    ? getUserName(request.peerGuideId)
    : null;

  switch (request.mode ?? "WeekSwap") {
    case "MonthSwap":
      return `${sourceGuide} swaps the entire ${request.monthKey ? formatMonthYear(request.monthKey) : "selected month"} week-off pattern with ${peerGuide ?? "the paired guide"}.`;
    case "WeekMove":
      return `${sourceGuide} moves the week off from ${formatDate(request.sourceDate)} to ${formatDate(request.peerDate)}.`;
    default:
      return `${sourceGuide} swaps ${formatDate(request.sourceDate)} with ${peerGuide ?? "the paired guide"} on ${formatDate(request.peerDate)}.`;
  }
}

export function getWeekoffResultSummary(request, getUserName) {
  const sourceGuide = getUserName(request.sourceGuideId);
  const peerGuide = request.peerGuideId
    ? getUserName(request.peerGuideId)
    : null;

  switch (request.mode ?? "WeekSwap") {
    case "MonthSwap":
      return `Week off Swap approved for ${sourceGuide} Saturday, Sunday weekoff with ${peerGuide ?? "the paired guide"} Thursday, Friday week off for the entire month.`;
    case "WeekMove":
      return `Week off Move approved only for ${sourceGuide} by moving the off day from ${formatDate(request.sourceDate)} Friday to ${formatDate(request.peerDate)} Thursday.`;
    default:
      return `Week off Swap approved for ${sourceGuide}  Thursday, Friday weekoff with ${peerGuide ?? "the paired guide"}   Saturday, Sunday weekoff  in the current week.`;
  }
}

export function getWeekoffAppliedTag(request, userId, date) {
  if (request.status !== "Approved") return null;

  switch (request.mode ?? "WeekSwap") {
    case "MonthSwap":
      return request.monthKey &&
        date.startsWith(request.monthKey) &&
        [request.sourceGuideId, request.peerGuideId].includes(userId)
        ? "monthSwap"
        : null;
    case "WeekMove":
      return request.sourceGuideId === userId && request.peerDate === date
        ? "weekMove"
        : null;
    default:
      if (request.sourceGuideId === userId && request.peerDate === date)
        return "weekSwap";
      if (request.peerGuideId === userId && request.sourceDate === date)
        return "weekSwap";
      return null;
  }
}
