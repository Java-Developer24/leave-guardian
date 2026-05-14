export function calcDailyShrinkage(date, leaves, schedule) {
  const scheduled = schedule.filter(
    (s) => s.date === date && !s.weekOff,
  ).length;
  if (scheduled === 0) return 0;
  const onLeave = leaves.filter(
    (l) =>
      l.date === date && ["Approved", "PendingSupervisor"].includes(l.status),
  ).length;
  return (onLeave / scheduled) * 100;
}

export function isDayBlocked(date, leaves, schedule, rules, holidays) {
  const holiday = holidays.find((h) => h.date === date);
  const cap = holiday?.allowedShrinkagePct ?? rules.maxDailyPct;
  const current = calcDailyShrinkage(date, leaves, schedule);
  return current >= cap;
}

export function agentMonthlyCount(userId, month, year, leaves) {
  return leaves.filter((l) => {
    const d = new Date(l.date);
    return (
      l.requesterId === userId &&
      d.getMonth() === month &&
      d.getFullYear() === year &&
      l.type === "Planned" &&
      ["Approved", "PendingSupervisor", "Submitted"].includes(l.status)
    );
  }).length;
}
