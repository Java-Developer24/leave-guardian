export function isWithinLeaveWindow(date, window) {
  if (!window.open) return false;
  const day = date.getDate();
  return day >= window.startDay && day <= window.endDay;
}

export function isTodayInWindowForMonth(window) {
  if (!window.open) return false;
  const today = new Date();
  return today.getDate() >= window.startDay && today.getDate() <= window.endDay;
}

export function getDaysInMonth(year, month) {
  const days = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function formatDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getMonthKey(date) {
  const d =
    typeof date === "string"
      ? new Date(date.length === 7 ? `${date}-01T00:00:00` : date)
      : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthYear(date) {
  const d =
    typeof date === "string"
      ? new Date(date.length === 7 ? `${date}-01T00:00:00` : date)
      : date;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatMonthShort(date) {
  const d =
    typeof date === "string"
      ? new Date(date.length === 7 ? `${date}-01T00:00:00` : date)
      : date;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export function formatTimeAsIST(time, includeZone = true) {
  const [hourRaw, minuteRaw] = time.split(":");
  const hours = Number(hourRaw);
  const minutes = Number(minuteRaw);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const label = `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
  return includeZone ? `${label} IST` : label;
}

export function formatShiftRangeIST(shiftStart, shiftEnd) {
  return `${formatTimeAsIST(shiftStart, false)} - ${formatTimeAsIST(shiftEnd)}`;
}

function parseDateTime(value) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}

export function hoursUntilDate(date, now = new Date()) {
  const target = parseDateTime(date);
  return (target.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function isWithinBufferHours(date, hours = 72, now = new Date()) {
  const hoursRemaining = hoursUntilDate(date, now);
  return hoursRemaining >= 0 && hoursRemaining < hours;
}

export function formatBufferAlert(date, hours = 72, now = new Date()) {
  if (!isWithinBufferHours(date, hours, now)) return null;
  const hoursRemaining = Math.max(1, Math.ceil(hoursUntilDate(date, now)));
  return `Inside ${hours}hr buffer window (${hoursRemaining}h left)`;
}

export function getApprovalDeadline(submittedAt, hours = 72) {
  const submitted = parseDateTime(submittedAt);
  return new Date(submitted.getTime() + hours * 60 * 60 * 1000);
}

export function getApprovalCountdown(
  submittedAt,
  hours = 72,
  now = new Date(),
) {
  const deadline = getApprovalDeadline(submittedAt, hours);
  const remainingMs = deadline.getTime() - now.getTime();
  const overdue = remainingMs <= 0;
  const totalMinutes = Math.max(
    0,
    Math.ceil(Math.abs(remainingMs) / (1000 * 60)),
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const text = overdue
    ? `Expired ${totalHours}h ${String(minutes).padStart(2, "0")}m ago`
    : `${totalHours}h ${String(minutes).padStart(2, "0")}m left`;

  return {
    deadline,
    overdue,
    text,
  };
}

export function getNextMonth() {
  const now = new Date();
  const m = now.getMonth() + 1;
  return m > 11
    ? { year: now.getFullYear() + 1, month: 0 }
    : { year: now.getFullYear(), month: m };
}
