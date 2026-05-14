import { toDateStr } from "@/core/utils/dates";
import {
  countScheduledGuidesForDepartment,
  estimateRequiredGuides,
} from "@/core/utils/forecast";

const COVERAGE_ACTIVE_LEAVE_STATUSES = [
  "Approved",
  "PendingSupervisor",
  "Submitted",
];
const HIDDEN_LEAVE_STATUSES = ["Rejected", "Cancelled"];

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date, days) {
  const next = parseDate(date);
  next.setDate(next.getDate() + days);
  return toDateStr(next);
}

function getScheduleRow(schedule, guideId, date) {
  return (
    schedule.find((row) => row.userId === guideId && row.date === date) ?? null
  );
}

function getAttendanceRow(attendance, guideId, date) {
  return (
    attendance.find((row) => row.userId === guideId && row.date === date) ??
    null
  );
}

export function getWeekDateKeys(weekStart) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getPriorDateKey(date) {
  return addDays(date, -1);
}

export function getLeaveDisplayOwnerId(leave) {
  return leave.type === "Transfer" && leave.peerId
    ? leave.peerId
    : leave.requesterId;
}

export function isVisibleGuideLeave(leave, guideId) {
  return (
    getLeaveDisplayOwnerId(leave) === guideId &&
    !HIDDEN_LEAVE_STATUSES.includes(leave.status)
  );
}

function hasGuideLeaveOnDate(leaves, guideId, date) {
  return leaves.some(
    (leave) => isVisibleGuideLeave(leave, guideId) && leave.date === date,
  );
}

function countCoverageLeavesOnDate(leaves, departmentId, date) {
  return leaves.filter(
    (leave) =>
      leave.departmentId === departmentId &&
      leave.date === date &&
      COVERAGE_ACTIVE_LEAVE_STATUSES.includes(leave.status),
  ).length;
}

function getSimulatedGuideWorkingStatus(params) {
  const {
    attendance,
    guideId,
    date,
    leaves,
    schedule,
    sourceDate,
    targetDate,
  } = params;

  const attendanceRow = getAttendanceRow(attendance, guideId, date);
  if (attendanceRow) return attendanceRow.present;

  if (hasGuideLeaveOnDate(leaves, guideId, date)) return false;

  const scheduleRow = getScheduleRow(schedule, guideId, date);
  if (!scheduleRow) return false;

  let isWeekOff = scheduleRow.weekOff;
  if (date === sourceDate) isWeekOff = false;
  if (date === targetDate) isWeekOff = true;

  return !isWeekOff;
}

function createsSevenDayWorkStreak(params) {
  const { attendance, guideId, leaves, schedule, sourceDate, targetDate } =
    params;

  const minDate = sourceDate <= targetDate ? sourceDate : targetDate;
  const maxDate = sourceDate <= targetDate ? targetDate : sourceDate;
  const windowStart = addDays(minDate, -6);
  const windowEnd = addDays(maxDate, 6);

  let cursor = windowStart;
  let streak = 0;

  while (cursor <= windowEnd) {
    const isWorking = getSimulatedGuideWorkingStatus({
      attendance,
      guideId,
      date: cursor,
      leaves,
      schedule,
      sourceDate,
      targetDate,
    });

    streak = isWorking ? streak + 1 : 0;
    if (streak >= 7) return true;

    cursor = addDays(cursor, 1);
  }

  return false;
}

export function validateWeekMoveRequest(params) {
  const {
    attendance,
    departmentId,
    guideId,
    leaves,
    schedule,
    sourceDate,
    targetDate,
    users,
    weekStart,
  } = params;

  const emptyResult = {
    allowed: false,
    availableAfterMove: 0,
    requiredGuides: 0,
  };
  const weekDates = new Set(getWeekDateKeys(weekStart));

  if (!sourceDate || !targetDate) {
    return {
      ...emptyResult,
      reason: "Select the current week off and the new workday first.",
    };
  }

  if (sourceDate === targetDate) {
    return {
      ...emptyResult,
      reason: "Choose a different workday in this same week.",
    };
  }

  const expectedTargetDate = getPriorDateKey(sourceDate);
  if (targetDate !== expectedTargetDate) {
    return {
      ...emptyResult,
      reason:
        "Move week off can only shift to the immediately previous day in the same week.",
    };
  }

  if (!weekDates.has(sourceDate) || !weekDates.has(targetDate)) {
    return {
      ...emptyResult,
      reason:
        "Move week off must stay inside the selected week and move only to the prior day.",
    };
  }

  const sourceRow = getScheduleRow(schedule, guideId, sourceDate);
  if (!sourceRow?.weekOff) {
    return {
      ...emptyResult,
      reason: "The selected source day is not the current week off.",
    };
  }

  const targetRow = getScheduleRow(schedule, guideId, targetDate);
  if (!targetRow || targetRow.weekOff) {
    return {
      ...emptyResult,
      reason: "The new week off must be moved to a working day in this week.",
    };
  }

  if (hasGuideLeaveOnDate(leaves, guideId, targetDate)) {
    return {
      ...emptyResult,
      reason: "The guide already has leave planned on that day.",
    };
  }

  const scheduledGuides = countScheduledGuidesForDepartment(
    targetDate,
    departmentId,
    schedule,
    users,
  );
  const activeLeaves = countCoverageLeavesOnDate(
    leaves,
    departmentId,
    targetDate,
  );
  const requiredGuides = estimateRequiredGuides(targetDate);
  const availableAfterMove = Math.max(0, scheduledGuides - activeLeaves - 1);

  if (availableAfterMove < requiredGuides) {
    return {
      allowed: false,
      reason: `Target-day coverage would drop below requirement (${availableAfterMove}/${requiredGuides}).`,
      availableAfterMove,
      requiredGuides,
    };
  }

  if (
    createsSevenDayWorkStreak({
      attendance,
      guideId,
      leaves,
      schedule,
      sourceDate,
      targetDate,
    })
  ) {
    return {
      allowed: false,
      reason: "This move would create a 7-day continuous login/work stretch.",
      availableAfterMove,
      requiredGuides,
    };
  }

  return {
    allowed: true,
    availableAfterMove,
    requiredGuides,
  };
}
