import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { pageTransition, staggerContainer, staggerItem } from "@/styles/motion";
import { useAppStore } from "@/state/store";
import SectionHeader from "@/components/SectionHeader";
import KpiCard from "@/components/kpis/KpiCard";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Filter,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Zap,
  Shield,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Treemap,
} from "recharts";
import { formatDate } from "@/core/utils/dates";

import { useEffect } from "react";

import {
  estimateForecastVolume,
  estimateRequiredGuides,
  countScheduledGuidesForDepartment,
} from "@/core/utils/forecast";
import { formatMonthYear, getMonthKey, toDateStr } from "@/core/utils/dates";
import {
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  MessageSquare,
  Send,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

const ACTIVE_REQUEST_STATUSES = [
  "Approved",
  "PendingSupervisor",
  "PendingPeer",
  "Submitted",
];
const PENDING_REQUEST_STATUSES = [
  "PendingSupervisor",
  "PendingPeer",
  "Submitted",
];
const ACTIVE_WEEKOFF_STATUSES = ["Approved", "PendingAdmin"];
const CHAT_HISTORY_STORAGE_KEY = "supervisor-analytics-chat-history-v1";
const CHAT_REPLY_DELAY_MS = 250;

function round1(value) {
  return Math.round(value * 10) / 10;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function getMonthStart(monthKey) {
  return parseDate(`${monthKey}-01`);
}

function getMonthEnd(monthKey) {
  const monthStart = getMonthStart(monthKey);
  return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getDateKey(date) {
  return toDateStr(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

function getDatesBetween(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const dates = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    dates.push(getDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getMonthKeysBetween(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    months.push(getMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function getCalendarDays(monthKey) {
  const monthStart = getMonthStart(monthKey);
  const monthEnd = getMonthEnd(monthKey);
  const days = [];
  const cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function formatShortDate(date) {
  return parseDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMonthInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatVariance(value) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function getOrderedRange(start, end) {
  return start <= end ? [start, end] : [end, start];
}

function buildChatSeed(today, departmentName) {
  return Array.from({ length: 5 }, (_, index) => {
    const offsetDate = new Date(today);
    offsetDate.setDate(offsetDate.getDate() - (4 - index));
    const createdAt = `${getDateKey(offsetDate)}T09:1${index}:00.000Z`;
    const responseAt = `${getDateKey(offsetDate)}T09:2${index}:00.000Z`;

    return [
      {
        id: `seed-user-${index}`,
        sender: "user",
        text:
          index % 2 === 0
            ? `Show me the highest shrinkage dates for ${departmentName}.`
            : "Do we have any safe week-off movement options this month?",
        createdAt,
      },
      {
        id: `seed-assistant-${index}`,
        sender: "assistant",
        text:
          index % 2 === 0
            ? `The top forecast pressure is concentrated in the current month risk window. Review the red-highlighted dates and compare scheduled guides against required guides before approving more leave.`
            : `There are low-impact days in the planner where week-off movement can be reviewed first, then week-off swaps can be used if daily availability still stays above the required guide count.`,
        createdAt: responseAt,
      },
    ];
  }).flat();
}

function pruneChatHistory(messages, today) {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 4);
  cutoff.setHours(0, 0, 0, 0);

  return messages
    .filter((message) => new Date(message.createdAt) >= cutoff)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function groupConsecutiveRiskDates(rows) {
  if (rows.length === 0) return [];

  const spans = [];
  let currentSpan = { start: rows[0].date, end: rows[0].date, days: 1 };

  for (let index = 1; index < rows.length; index += 1) {
    const previous = parseDate(rows[index - 1].date);
    const current = parseDate(rows[index].date);
    const diffDays = Math.round(
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      currentSpan.end = rows[index].date;
      currentSpan.days += 1;
      continue;
    }

    spans.push(currentSpan);
    currentSpan = { start: rows[index].date, end: rows[index].date, days: 1 };
  }

  spans.push(currentSpan);
  return spans;
}
const tooltipStyle = {
  background: "hsl(25, 60%, 97%)",
  border: "1px solid hsl(25, 22%, 88%)",
  borderRadius: 12,
  fontSize: 11,
  padding: "8px 12px",
};

const DEPT_COLORS = [
  "hsl(356, 98%, 65%)",
  "hsl(37, 100%, 58%)",
  "hsl(215, 100%, 58%)",
  "hsl(152, 69%, 42%)",
  "hsl(280, 80%, 60%)",
  "hsl(190, 90%, 50%)",
  "hsl(45, 100%, 50%)",
  "hsl(320, 80%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(10, 90%, 55%)",
  "hsl(240, 60%, 60%)",
];

const STATUS_COLORS = {
  Approved: "hsl(152, 69%, 42%)",
  Rejected: "hsl(0, 85%, 60%)",
  PendingSupervisor: "hsl(37, 100%, 58%)",
  PendingPeer: "hsl(215, 100%, 58%)",
};

function TreemapContent(props) {
  const { x, y, width, height, name, value, shrinkage, index } = props;
  if (width < 8 || height < 8) return null;
  const color = DEPT_COLORS[index % DEPT_COLORS.length];
  const shortName = name
    ?.replace("Messaging - ", "M-")
    .replace("Messaging ", "M-");
  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        rx={8}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.3}
      />
      {width > 50 && height > 40 && (
        <>
          <text
            x={x + 8}
            y={y + 22}
            fontSize={11}
            fontWeight={700}
            fill="hsl(120,7%,9%)"
            fontFamily="Funnel Sans"
          >
            {shortName && shortName.length > Math.floor(width / 8)
              ? shortName.slice(0, Math.floor(width / 8)) + "…"
              : shortName}
          </text>
          <text
            x={x + 8}
            y={y + 36}
            fontSize={10}
            fontWeight={600}
            fill={color}
            fontFamily="Funnel Sans"
          >
            {value} leaves{" "}
          </text>
          <text
            x={x + 10}
            y={y + 50}
            fontSize={10}
            fontWeight={600}
            fill={color}
            fontFamily="Funnel Sans"
          >
            {props.payload?.shrinkage?.toFixed(1) || "0"}% shrinkage
          </text>
        </>
      )}
    </g>
  );
}

export default function AdminAnalytics() {
  const {
    leaves,
    schedule,
    rules,
    currentUser,
    users,
    departments,
    attendance,
    weekoffSwapRequests,
  } = useAppStore();
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateStr(today);
  const previousDay = useMemo(() => {
    const value = new Date(today);
    value.setDate(value.getDate() - 1);
    return toDateStr(value);
  }, [today]);
  const deptId = currentUser?.departmentId ?? "d1";
  const myDept = departments.find((department) => department.id === deptId);
  const initialMonthKey = getMonthKey(today);
  const initialDateFrom = toDateStr(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const initialDateTo = toDateStr(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);
  const [rangePreset, setRangePreset] = useState(1);
  const [forecastMonthKey, setForecastMonthKey] = useState(initialMonthKey);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [teamRiskFilterMode, setTeamRiskFilterMode] = useState("month");
  const [teamRiskMonthKey, setTeamRiskMonthKey] = useState(initialMonthKey);
  const [teamRiskMonthFrom, setTeamRiskMonthFrom] = useState(initialMonthKey);
  const [teamRiskMonthTo, setTeamRiskMonthTo] = useState(initialMonthKey);
  const [teamRiskDateFrom, setTeamRiskDateFrom] = useState(initialDateFrom);
  const [teamRiskDateTo, setTeamRiskDateTo] = useState(initialDateTo);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  useEffect(() => {
    if (rangePreset === "custom") return;
    const selectedMonthDate = getMonthStart(selectedMonthKey);
    const rangeStart = addMonths(selectedMonthDate, -(rangePreset - 1));
    setDateFrom(toDateStr(rangeStart));
    setDateTo(toDateStr(getMonthEnd(selectedMonthKey)));
  }, [selectedMonthKey, rangePreset]);
  useEffect(() => {
    setForecastMonthKey(selectedMonthKey);
  }, [selectedMonthKey]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    const seed = buildChatSeed(today, myDept?.name ?? "your department");
    try {
      const parsed = stored ? JSON.parse(stored) : seed;
      const pruned = pruneChatHistory(parsed, today);
      setChatMessages(pruned);
      window.localStorage.setItem(
        CHAT_HISTORY_STORAGE_KEY,
        JSON.stringify(pruned),
      );
    } catch {
      const pruned = pruneChatHistory(seed, today);
      setChatMessages(pruned);
      window.localStorage.setItem(
        CHAT_HISTORY_STORAGE_KEY,
        JSON.stringify(pruned),
      );
    }
  }, [today, myDept?.name]);
  useEffect(() => {
    if (typeof window === "undefined" || chatMessages.length === 0) return;
    window.localStorage.setItem(
      CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(pruneChatHistory(chatMessages, today)),
    );
  }, [chatMessages, today]);
  const teamAgents = useMemo(
    () =>
      users
        .filter((user) => user.role === "agent" && user.departmentId === deptId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users, deptId],
  );
  const teamAgentIds = useMemo(
    () => new Set(teamAgents.map((agent) => agent.id)),
    [teamAgents],
  );
  const deptLeaves = useMemo(
    () => leaves.filter((leave) => leave.departmentId === deptId),
    [leaves, deptId],
  );
  const deptWeekoffRequests = useMemo(
    () =>
      weekoffSwapRequests.filter(
        (request) =>
          request.departmentId === deptId &&
          ACTIVE_WEEKOFF_STATUSES.includes(request.status),
      ),
    [weekoffSwapRequests, deptId],
  );
  const deptAttendance = useMemo(
    () => attendance.filter((item) => teamAgentIds.has(item.userId)),
    [attendance, teamAgentIds],
  );
  const periodDates = useMemo(
    () => getDatesBetween(dateFrom, dateTo),
    [dateFrom, dateTo],
  );
  const selectedMonthDates = useMemo(
    () => getCalendarDays(selectedMonthKey).map((day) => toDateStr(day)),
    [selectedMonthKey],
  );
  const forecastMonthDates = useMemo(
    () => getCalendarDays(forecastMonthKey).map((day) => toDateStr(day)),
    [forecastMonthKey],
  );
  const datesToBuild = useMemo(
    () =>
      Array.from(
        new Set([...periodDates, ...selectedMonthDates, ...forecastMonthDates]),
      ).sort((a, b) => a.localeCompare(b)),
    [periodDates, selectedMonthDates, forecastMonthDates],
  );
  const dailyMetricsByDate = useMemo(() => {
    return datesToBuild.reduce((acc, date) => {
      const scheduledGuides = countScheduledGuidesForDepartment(
        date,
        deptId,
        schedule,
        users,
      );
      const dayLeaves = deptLeaves.filter(
        (leave) =>
          leave.date === date && ACTIVE_REQUEST_STATUSES.includes(leave.status),
      );
      const approvedLeaves = dayLeaves
        .filter((leave) => leave.status === "Approved")
        .reduce((total, leave) => total + leave.days, 0);
      const pendingLeaves = dayLeaves
        .filter((leave) => PENDING_REQUEST_STATUSES.includes(leave.status))
        .reduce((total, leave) => total + leave.days, 0);
      const plannedLeaves = dayLeaves
        .filter((leave) => leave.type === "Planned")
        .reduce((total, leave) => total + leave.days, 0);
      const unplannedLeaves = dayLeaves
        .filter((leave) => leave.type === "Unplanned")
        .reduce((total, leave) => total + leave.days, 0);
      const weekoffSwapCount = deptWeekoffRequests.filter((request) => {
        const mode = request.mode ?? "WeekSwap";
        if (mode === "WeekMove") return false;
        return request.sourceDate === date || request.peerDate === date;
      }).length;
      const weekoffMoveCount = deptWeekoffRequests.filter((request) => {
        const mode = request.mode ?? "WeekSwap";
        return mode === "WeekMove" && request.peerDate === date;
      }).length;
      const activeLeaves = approvedLeaves + pendingLeaves;
      const forecastVolume = estimateForecastVolume(date);
      const requiredGuides = estimateRequiredGuides(date);
      const availableGuides = Math.max(0, scheduledGuides - activeLeaves);
      const shrinkagePct =
        scheduledGuides === 0
          ? 0
          : round1((activeLeaves / scheduledGuides) * 100);
      const plannedShrinkagePct =
        scheduledGuides === 0
          ? 0
          : round1((plannedLeaves / scheduledGuides) * 100);
      const unplannedShrinkagePct =
        scheduledGuides === 0
          ? 0
          : round1((unplannedLeaves / scheduledGuides) * 100);
      const coverageGap = Math.max(0, requiredGuides - availableGuides);
      const forecastedShrinkagePct =
        scheduledGuides === 0
          ? 0
          : round1(((activeLeaves + coverageGap) / scheduledGuides) * 100);
      acc[date] = {
        date,
        scheduledGuides,
        requiredGuides,
        forecastVolume,
        approvedLeaves,
        pendingLeaves,
        activeLeaves,
        plannedLeaves,
        unplannedLeaves,
        plannedShrinkagePct,
        unplannedShrinkagePct,
        shrinkagePct,
        availableGuides,
        forecastedShrinkagePct,
        weekoffSwapCount,
        weekoffMoveCount,
        isHighRisk:
          availableGuides < requiredGuides || shrinkagePct >= rules.maxDailyPct,
      };
      return acc;
    }, {});
  }, [
    datesToBuild,
    deptId,
    schedule,
    users,
    deptLeaves,
    deptWeekoffRequests,
    rules.maxDailyPct,
  ]);
  const selectedMonthMetrics = useMemo(
    () =>
      selectedMonthDates
        .map((date) => dailyMetricsByDate[date])
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [selectedMonthDates, dailyMetricsByDate],
  );
  const periodMetrics = useMemo(
    () =>
      periodDates
        .map((date) => dailyMetricsByDate[date])
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [periodDates, dailyMetricsByDate],
  );
  const selectedMonthLabel = formatMonthYear(selectedMonthKey);
  const forecastMonthLabel = formatMonthYear(forecastMonthKey);
  const forecastNextMonthLabel = formatMonthYear(
    addMonths(getMonthStart(forecastMonthKey), 1),
  );
  const rangeMonthKeys = useMemo(
    () => getMonthKeysBetween(dateFrom, dateTo),
    [dateFrom, dateTo],
  );
  const [teamRiskMonthRangeStart, teamRiskMonthRangeEnd] = useMemo(
    () =>
      getOrderedRange(
        teamRiskMonthFrom || initialMonthKey,
        teamRiskMonthTo || initialMonthKey,
      ),
    [teamRiskMonthFrom, teamRiskMonthTo, initialMonthKey],
  );
  const [teamRiskDateRangeStart, teamRiskDateRangeEnd] = useMemo(
    () =>
      getOrderedRange(
        teamRiskDateFrom || initialDateFrom,
        teamRiskDateTo || initialDateTo,
      ),
    [teamRiskDateFrom, teamRiskDateTo, initialDateFrom, initialDateTo],
  );
  const selectedRangeMonths = useMemo(() => {
    if (rangePreset === "custom") {
      return rangeMonthKeys.map((monthKey) => ({
        key: monthKey,
        label: formatMonthYear(monthKey),
      }));
    }
    return Array.from({ length: rangePreset }, (_, index) => {
      const monthDate = addMonths(
        getMonthStart(selectedMonthKey),
        -(rangePreset - 1) + index,
      );
      const monthKey = formatMonthInput(monthDate);
      return { key: monthKey, label: formatMonthYear(monthKey) };
    });
  }, [rangeMonthKeys, rangePreset, selectedMonthKey]);
  const teamRiskWindow = useMemo(() => {
    if (teamRiskFilterMode === "monthRange") {
      return {
        dateFrom: toDateStr(getMonthStart(teamRiskMonthRangeStart)),
        dateTo: toDateStr(getMonthEnd(teamRiskMonthRangeEnd)),
        label:
          teamRiskMonthRangeStart === teamRiskMonthRangeEnd
            ? formatMonthYear(teamRiskMonthRangeStart)
            : `${formatMonthYear(teamRiskMonthRangeStart)} to ${formatMonthYear(teamRiskMonthRangeEnd)}`,
        helperLabel: "Month range",
      };
    }
    if (teamRiskFilterMode === "dateRange") {
      return {
        dateFrom: teamRiskDateRangeStart,
        dateTo: teamRiskDateRangeEnd,
        label:
          teamRiskDateRangeStart === teamRiskDateRangeEnd
            ? formatDate(teamRiskDateRangeStart)
            : `${formatDate(teamRiskDateRangeStart)} to ${formatDate(teamRiskDateRangeEnd)}`,
        helperLabel: "Custom date range",
      };
    }
    const activeMonthKey = teamRiskMonthKey || initialMonthKey;
    return {
      dateFrom: toDateStr(getMonthStart(activeMonthKey)),
      dateTo: toDateStr(getMonthEnd(activeMonthKey)),
      label: formatMonthYear(activeMonthKey),
      helperLabel: "Single month",
    };
  }, [
    teamRiskFilterMode,
    teamRiskMonthRangeStart,
    teamRiskMonthRangeEnd,
    teamRiskDateRangeStart,
    teamRiskDateRangeEnd,
    teamRiskMonthKey,
    initialMonthKey,
  ]);
  const teamRiskDescription = useMemo(
    () =>
      `Each guide shows approved leaves for ${teamRiskWindow.label}, split by planned and unplanned leave with total leave percentage for the selected period.`,
    [teamRiskWindow.label],
  );
  const shrinkageSummary = useMemo(() => {
    const totalScheduled = periodMetrics.reduce(
      (total, item) => total + item.scheduledGuides,
      0,
    );
    const totalPlannedLeaves = periodMetrics.reduce(
      (total, item) => total + item.plannedLeaves,
      0,
    );
    const totalUnplannedLeaves = periodMetrics.reduce(
      (total, item) => total + item.unplannedLeaves,
      0,
    );
    const totalActiveLeaves = periodMetrics.reduce(
      (total, item) => total + item.activeLeaves,
      0,
    );
    return {
      totalScheduled,
      totalActiveLeaves,
      overallShrinkagePct:
        totalScheduled === 0
          ? 0
          : round1((totalActiveLeaves / totalScheduled) * 100),
      plannedShrinkagePct:
        totalScheduled === 0
          ? 0
          : round1((totalPlannedLeaves / totalScheduled) * 100),
      unplannedShrinkagePct:
        totalScheduled === 0
          ? 0
          : round1((totalUnplannedLeaves / totalScheduled) * 100),
    };
  }, [periodMetrics]);
  const selectedMonthHours = useMemo(() => {
    const targetHours = selectedMonthMetrics.reduce(
      (total, item) => total + item.scheduledGuides * 8,
      0,
    );
    const actualHours = Math.max(
      0,
      targetHours -
        selectedMonthMetrics.reduce(
          (total, item) => total + item.approvedLeaves,
          0,
        ) *
          8,
    );
    return {
      targetHours,
      actualHours,
      deficitHours: Math.max(0, targetHours - actualHours),
    };
  }, [selectedMonthMetrics]);
  const currentMonthLeaves = useMemo(
    () =>
      deptLeaves.filter(
        (leave) =>
          leave.date.startsWith(selectedMonthKey) &&
          ACTIVE_REQUEST_STATUSES.includes(leave.status),
      ),
    [deptLeaves, selectedMonthKey],
  );
  const highRiskRows = useMemo(
    () =>
      selectedMonthMetrics
        .filter((item) => item.isHighRisk)
        .sort(
          (a, b) =>
            b.forecastedShrinkagePct - a.forecastedShrinkagePct ||
            a.date.localeCompare(b.date),
        ),
    [selectedMonthMetrics],
  );
  const monthlyAttendanceTrend = useMemo(() => {
    return rangeMonthKeys.map((monthKey) => {
      const monthPlanned = schedule.filter(
        (row) =>
          teamAgentIds.has(row.userId) &&
          row.date.startsWith(monthKey) &&
          row.date >= dateFrom &&
          row.date <= dateTo &&
          !row.weekOff,
      ).length;
      const monthApprovedLeaves = deptLeaves
        .filter(
          (leave) =>
            leave.date.startsWith(monthKey) &&
            leave.date >= dateFrom &&
            leave.date <= dateTo &&
            leave.status === "Approved",
        )
        .reduce((total, leave) => total + leave.days, 0);
      const approvedLeaveKeys = new Set(
        deptLeaves
          .filter(
            (leave) =>
              leave.date.startsWith(monthKey) &&
              leave.date >= dateFrom &&
              leave.date <= dateTo &&
              leave.status === "Approved",
          )
          .map((leave) => `${leave.requesterId}-${leave.date}`),
      );
      const recordedAbsenceDays = deptAttendance.filter(
        (row) =>
          !row.present &&
          row.date.startsWith(monthKey) &&
          row.date >= dateFrom &&
          row.date <= dateTo &&
          !approvedLeaveKeys.has(`${row.userId}-${row.date}`),
      ).length;
      const actual = Math.max(
        0,
        monthPlanned - monthApprovedLeaves - recordedAbsenceDays,
      );
      const variance = actual - monthPlanned;
      const variancePct =
        monthPlanned === 0 ? 0 : round1((variance / monthPlanned) * 100);
      return {
        monthKey,
        label: formatMonthYear(monthKey),
        planned: monthPlanned,
        actual,
        variance,
        variancePct,
      };
    });
  }, [
    rangeMonthKeys,
    schedule,
    teamAgentIds,
    dateFrom,
    dateTo,
    deptLeaves,
    deptAttendance,
  ]);
  const displayMonthlyAttendanceTrend = useMemo(() => {
    const minimumCards = 3;
    const displayCount = Math.max(minimumCards, monthlyAttendanceTrend.length);
    const trendByMonth = new Map(
      monthlyAttendanceTrend.map((item) => [item.monthKey, item]),
    );
    const anchorTrend = monthlyAttendanceTrend.find(
      (item) => item.planned > 0 || item.actual > 0,
    ) ?? {
      monthKey: selectedMonthKey,
      label: formatMonthYear(selectedMonthKey),
      planned: Math.max(48, teamAgents.length * 20),
      actual: Math.max(42, teamAgents.length * 20 - 4),
      variance: -4,
      variancePct: -7.5,
    };
    return Array.from({ length: displayCount }, (_, index) => {
      const monthDate = addMonths(
        getMonthStart(selectedMonthKey),
        -(displayCount - 1 - index),
      );
      const monthKey = formatMonthInput(monthDate);
      const existing = trendByMonth.get(monthKey);
      if (existing && (existing.planned > 0 || existing.actual > 0)) {
        return existing;
      }
      const recencyOffset = displayCount - 1 - index;
      const planned = Math.max(
        44,
        anchorTrend.planned - recencyOffset * 4 + (index % 2 === 0 ? 2 : -1),
      );
      const actualGap = 2 + (recencyOffset % 3);
      const actual = Math.max(38, planned - actualGap);
      const variance = actual - planned;
      return {
        monthKey,
        label: formatMonthYear(monthKey),
        planned,
        actual,
        variance,
        variancePct: planned === 0 ? 0 : round1((variance / planned) * 100),
        isReference: true,
      };
    });
  }, [monthlyAttendanceTrend, selectedMonthKey, teamAgents.length]);
  const attendanceTrendMax = useMemo(
    () =>
      Math.max(
        1,
        ...displayMonthlyAttendanceTrend.flatMap((item) => [
          item.planned,
          item.actual,
        ]),
      ),
    [displayMonthlyAttendanceTrend],
  );
  const teamRiskRows = useMemo(() => {
    return teamAgents
      .map((agent) => {
        const agentLeaves = deptLeaves.filter(
          (leave) =>
            leave.requesterId === agent.id &&
            leave.status === "Approved" &&
            leave.date >= teamRiskWindow.dateFrom &&
            leave.date <= teamRiskWindow.dateTo,
        );
        const planned = agentLeaves
          .filter((leave) => leave.type === "Planned")
          .reduce((total, leave) => total + leave.days, 0);
        const unplanned = agentLeaves
          .filter((leave) => leave.type === "Unplanned")
          .reduce((total, leave) => total + leave.days, 0);
        const approved = planned + unplanned;
        const scheduledDays = schedule.filter(
          (row) =>
            row.userId === agent.id &&
            row.date >= teamRiskWindow.dateFrom &&
            row.date <= teamRiskWindow.dateTo &&
            !row.weekOff,
        ).length;
        const leavePct =
          scheduledDays === 0 ? 0 : round1((approved / scheduledDays) * 100);
        return {
          id: agent.id,
          name: agent.name,
          approved,
          planned,
          unplanned,
          leavePct,
          riskLabel:
            leavePct >= 16 ? "High" : leavePct >= 10 ? "Moderate" : "Low",
        };
      })
      .sort((a, b) => b.leavePct - a.leavePct || b.approved - a.approved);
  }, [
    teamAgents,
    deptLeaves,
    teamRiskWindow.dateFrom,
    teamRiskWindow.dateTo,
    schedule,
  ]);
  const riskSpans = useMemo(
    () =>
      groupConsecutiveRiskDates(
        [...highRiskRows].sort((a, b) => a.date.localeCompare(b.date)),
      ),
    [highRiskRows],
  );
  const weekoffOpportunity = useMemo(() => {
    for (const riskRow of [...highRiskRows].sort(
      (a, b) => b.shrinkagePct - a.shrinkagePct,
    )) {
      for (const agent of teamAgents) {
        const riskDay = schedule.find(
          (row) => row.userId === agent.id && row.date === riskRow.date,
        );
        if (!riskDay?.weekOff) continue;
        for (const candidate of selectedMonthMetrics) {
          if (candidate.date === riskRow.date) continue;
          const candidateDay = schedule.find(
            (row) => row.userId === agent.id && row.date === candidate.date,
          );
          if (!candidateDay || candidateDay.weekOff) continue;
          const availableAfterMove = candidate.availableGuides - 1;
          if (availableAfterMove >= candidate.requiredGuides) {
            return {
              agentName: agent.name,
              riskDate: riskRow.date,
              targetDate: candidate.date,
            };
          }
        }
      }
    }
    return null;
  }, [highRiskRows, teamAgents, schedule, selectedMonthMetrics]);
  const productionRecommendation = useMemo(() => {
    const leavesToReduce = Math.ceil(selectedMonthHours.deficitHours / 8);
    return {
      leavesToReduce,
      deficitHours: selectedMonthHours.deficitHours,
    };
  }, [selectedMonthHours]);
  const performanceCalendarDays = useMemo(
    () => getCalendarDays(selectedMonthKey),
    [selectedMonthKey],
  );
  const performanceCalendarOffset = performanceCalendarDays[0]?.getDay() ?? 0;
  const forecastCalendarDays = useMemo(
    () => getCalendarDays(forecastMonthKey),
    [forecastMonthKey],
  );
  const forecastCalendarOffset = forecastCalendarDays[0]?.getDay() ?? 0;
  const chatHistoryByDay = useMemo(() => {
    return pruneChatHistory(chatMessages, today).reduce((acc, message) => {
      const key = message.createdAt.slice(0, 10);
      acc[key] = [...(acc[key] ?? []), message];
      return acc;
    }, {});
  }, [chatMessages, today]);
  const handleMonthStep = (direction) => {
    const next = addMonths(getMonthStart(selectedMonthKey), direction);
    setSelectedMonthKey(formatMonthInput(next));
  };
  const handleForecastMonthStep = (direction) => {
    const next = addMonths(getMonthStart(forecastMonthKey), direction);
    setForecastMonthKey(formatMonthInput(next));
  };
  const handleTeamRiskMonthStep = (direction) => {
    const next = addMonths(
      getMonthStart(teamRiskMonthKey || initialMonthKey),
      direction,
    );
    setTeamRiskMonthKey(formatMonthInput(next));
  };

  const [deptFilter, setDeptFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [activeTab, setActiveTab] = useState("overview");

  const timeFilteredLeaves = useMemo(() => {
    if (timeRange === "all") return leaves;
    const monthMap = { jan: "01", feb: "02", mar: "03" };
    return leaves.filter((l) =>
      l.date.startsWith(`2026-${monthMap[timeRange]}`),
    );
  }, [leaves, timeRange]);

  const filteredLeaves =
    deptFilter === "all"
      ? timeFilteredLeaves
      : timeFilteredLeaves.filter((l) => l.departmentId === deptFilter);
  const totalAgents = users.filter(
    (u) =>
      u.role === "agent" &&
      (deptFilter === "all" || u.departmentId === deptFilter),
  ).length;
  const totalLeaves = filteredLeaves.length;
  const approved = filteredLeaves.filter((l) => l.status === "Approved").length;
  const rejected = filteredLeaves.filter((l) => l.status === "Rejected").length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
  const pendingCount = filteredLeaves.filter(
    (l) => l.status === "PendingSupervisor",
  ).length;
  const peerPending = filteredLeaves.filter(
    (l) => l.status === "PendingPeer",
  ).length;

  const deptBreakdown = useMemo(() => {
    return departments
      .filter((dept) => {
        if (deptFilter !== "all" && dept.id !== deptFilter) return false;
        if (
          searchTerm &&
          !dept.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      })
      .map((dept) => {
        const agents = users.filter(
          (u) => u.role === "agent" && u.departmentId === dept.id,
        ).length;
        const dl = timeFilteredLeaves.filter((l) => l.departmentId === dept.id);
        const da = dl.filter((l) => l.status === "Approved").length;
        const dr = dl.filter((l) => l.status === "Rejected").length;
        const dp = dl.filter((l) => l.status === "PendingSupervisor").length;
        const du = dl.filter((l) => l.type === "Unplanned").length;
        const avg =
          agents > 0 ? parseFloat((dl.length / agents).toFixed(1)) : 0;
        const shrinkage =
          agents > 0
            ? parseFloat(((da / Math.max(1, agents * 20)) * 100).toFixed(1))
            : 0;
        return {
          id: dept.id,
          dept: dept.name,
          agents,
          leaves: dl.length,
          approved: da,
          rejected: dr,
          pending: dp,
          unplanned: du,
          avgPerAgent: avg,
          shrinkage,
        };
      })
      .sort((a, b) => b.shrinkage - a.shrinkage);
  }, [departments, users, timeFilteredLeaves, deptFilter, searchTerm]);

  const statusData = useMemo(
    () =>
      [
        { name: "Approved", value: approved, fill: STATUS_COLORS.Approved },
        { name: "Rejected", value: rejected, fill: STATUS_COLORS.Rejected },
        {
          name: "Pending",
          value: pendingCount,
          fill: STATUS_COLORS.PendingSupervisor,
        },
        {
          name: "Peer Pending",
          value: peerPending,
          fill: STATUS_COLORS.PendingPeer,
        },
      ].filter((d) => d.value > 0),
    [approved, rejected, pendingCount, peerPending],
  );

  const treemapData = useMemo(
    () =>
      deptBreakdown
        .slice(0, 8)
        .sort((a, b) => b.shrinkage - a.shrinkage)
        .map((d) => ({ name: d.dept, size: d.leaves, shrinkage: d.shrinkage })),
    [deptBreakdown],
  );

  const monthlyTrend = useMemo(() => {
    return [
      { key: "2026-01", label: "Jan" },
      { key: "2026-02", label: "Feb" },
      { key: "2026-03", label: "Mar" },
    ].map((m) => {
      const ml = leaves.filter((l) => l.date.startsWith(m.key));
      return {
        month: m.label,
        total: ml.length,
        approved: ml.filter((l) => l.status === "Approved").length,
        rejected: ml.filter((l) => l.status === "Rejected").length,
      };
    });
  }, [leaves]);

  // Shrinkage forecast
  const shrinkageForecast = [
    { month: "January", pct: 6.2, target: rules.maxDailyPct },
    { month: "February", pct: 7.8, target: rules.maxDailyPct },
    { month: "March", pct: 9.1, target: rules.maxDailyPct },
  ];

  // Risk dates
  const riskDates = useMemo(() => {
    const dateMap = {};
    filteredLeaves.forEach((l) => {
      dateMap[l.date] = (dateMap[l.date] || 0) + 1;
    });
    return Object.entries(dateMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([date, requests]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        requests,
        severity: requests >= 6 ? "High" : requests >= 3 ? "Moderate" : "Low",
        desc: `${requests} concurrent requests`,
      }));
  }, [filteredLeaves]);

  // Dept risk
  const deptRisk = useMemo(
    () =>
      deptBreakdown.slice(0, 6).map((d) => ({
        name: d.dept.replace("Messaging - ", "").replace("Messaging ", ""),
        shrinkage: d.shrinkage,
        risk: d.shrinkage > 8 ? "High" : d.shrinkage > 5 ? "Moderate" : "Low",
      })),
    [deptBreakdown],
  );

  const deptScatter = useMemo(
    () =>
      deptBreakdown.map((d, i) => ({
        name: d.dept.replace("Messaging - ", "M-").replace("Messaging ", "M-"),
        leavesPerAgent: d.avgPerAgent,
        shrinkage: d.shrinkage,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      })),
    [deptBreakdown],
  );

  const selectedDeptName =
    deptFilter === "all"
      ? "All Departments"
      : (departments.find((d) => d.id === deptFilter)?.name ?? "");

  // Supervisor-style calculated metrics for admin day-wise insights
  const highRiskDepts = useMemo(
    () => deptBreakdown.filter((d) => d.shrinkage >= rules.maxDailyPct),
    [deptBreakdown, rules.maxDailyPct],
  );
  const totalScheduledGuides = useMemo(() => totalAgents * 20, [totalAgents]);
  const actualHours = useMemo(
    () => Math.max(0, (totalScheduledGuides - approved) * 8),
    [totalScheduledGuides, approved],
  );
  const targetHours = useMemo(
    () => totalScheduledGuides * 8,
    [totalScheduledGuides],
  );
  const plannedLeaveCount = useMemo(
    () => filteredLeaves.filter((l) => l.type === "Planned").length,
    [filteredLeaves],
  );
  const unplannedLeaveCount = useMemo(
    () => filteredLeaves.filter((l) => l.type === "Unplanned").length,
    [filteredLeaves],
  );
  const overallShrinkagePct = useMemo(
    () =>
      totalScheduledGuides > 0
        ? Math.round((approved / totalScheduledGuides) * 100 * 10) / 10
        : 0,
    [approved, totalScheduledGuides],
  );
  const plannedShrinkagePct = useMemo(
    () =>
      totalScheduledGuides > 0
        ? Math.round((plannedLeaveCount / totalScheduledGuides) * 100 * 10) / 10
        : 0,
    [plannedLeaveCount, totalScheduledGuides],
  );
  const unplannedShrinkagePct = useMemo(
    () =>
      totalScheduledGuides > 0
        ? Math.round((unplannedLeaveCount / totalScheduledGuides) * 100 * 10) /
          10
        : 0,
    [unplannedLeaveCount, totalScheduledGuides],
  );

  // Recommendations
  const recommendations = [
    {
      title: "Redistribute peak-day leaves",
      desc: "Multiple dates show 6+ concurrent requests. Recommend staggering.",
      severity: "high",
    },
    {
      title: "Increase caps for Inbound team",
      desc: "Inbound department consistently hits monthly cap. Consider raising to 3/agent.",
      severity: "medium",
    },
    {
      title: "Review cross-department transfers",
      desc: "High swap/transfer ratio in Outbound. May indicate scheduling issues.",
      severity: "low",
    },
  ];
  const CHAT_REPLY_DELAY_MS = 250;
  const buildAssistantReply = (userPrompt) => {
    const loweredPrompt = userPrompt.toLowerCase();

    if (loweredPrompt.includes("risk")) {
      const topRiskDept = deptBreakdown.slice(0, 1)[0];
      return topRiskDept
        ? `The highest risk department is ${topRiskDept.dept} with ${topRiskDept.shrinkage}% shrinkage and ${topRiskDept.leaves} total requests. ${topRiskDept.unplanned} of those are unplanned leaves.`
        : "There are no high-risk dates detected currently across departments.";
    }

    if (
      loweredPrompt.includes("shrinkage") ||
      loweredPrompt.includes("forecast")
    ) {
      const avgShrinkage = (
        deptBreakdown.reduce((sum, d) => sum + d.shrinkage, 0) /
        deptBreakdown.length
      ).toFixed(1);
      return `Average shrinkage across all departments is ${avgShrinkage}%. The department cap is set to ${rules.maxDailyPct}%. Review department-wise breakdown for high-risk areas.`;
    }

    if (
      loweredPrompt.includes("approval") ||
      loweredPrompt.includes("pending")
    ) {
      const totalDecided = approved + rejected;
      const rate =
        totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 0;
      return `Current approval rate is ${rate}% with ${pendingCount} pending approvals and ${peerPending} peer reviews pending. Review pending queue in the Approvals section.`;
    }

    return `Enterprise analytics dashboard showing ${departments.length} departments with ${totalLeaves} total leave requests. Use filters to drill down into specific departments or date ranges. Check the Day-wise Insights tab for calendar analytics.`;
  };
  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `chat-user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((previous) =>
      pruneChatHistory([...previous, userMessage], today),
    );
    setChatInput("");
    setIsBotTyping(true);

    window.setTimeout(() => {
      const assistantMessage = {
        id: `chat-assistant-${Date.now() + 1}`,
        sender: "assistant",
        text: buildAssistantReply(trimmed),
        createdAt: new Date().toISOString(),
      };

      setChatMessages((previous) =>
        pruneChatHistory([...previous, assistantMessage], today),
      );
      setIsBotTyping(false);
    }, CHAT_REPLY_DELAY_MS);
  };
  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Analytics Dashboard"
        title="Performance"
        highlight="Insights"
        description={`Enterprise analytics across ${departments.length} departments, ${totalAgents} agents, and ${totalLeaves} leave requests.`}
        action={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-xs font-bold"
          >
            <Bot size={14} />
            <span className="hidden sm:inline">Insights Assistant</span>
          </motion.button>
        }
      />

      {/* Tab Navigation */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <TabsList className="bg-muted/40 border border-border">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp size={14} />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="daywise" className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Day-wise Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Filter Toolbar */}
            <div className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-primary" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="glass-input w-auto min-w-[180px] py-2 text-xs"
                >
                  <option value="all">
                    All Departments ({departments.length})
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border">
                {["jan", "feb", "mar", "apr"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${timeRange === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t === "apr" ? "apr" : t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                <input
                  type="month"
                  value={selectedMonth.substring(0, 7)}
                  onChange={(e) => setSelectedMonth(e.target.value + "-01")}
                  className="glass-input w-auto py-2 text-xs"
                />
              </div>
              <div className="relative flex-1 max-w-[180px]"></div>
              <span className="text-[10px] text-muted-foreground md:ml-auto flex items-center gap-1.5">
                <Building2 size={11} />{" "}
                <strong className="text-foreground">{selectedDeptName}</strong>
              </span>
            </div>

            {/* KPI Row */}
            <motion.div
              {...staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Total Leaves"
                  value={totalLeaves}
                  icon={<Calendar size={18} />}
                  accent="primary"
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Approved"
                  value={approved}
                  icon={<CheckCircle size={18} />}
                  accent="success"
                  trend={{ value: `${approvalRate}%`, direction: "up" }}
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Pending"
                  value={pendingCount}
                  icon={<Clock size={18} />}
                  accent="warning"
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Agents"
                  value={totalAgents}
                  icon={<Users size={18} />}
                  accent="info"
                />
              </motion.div>
            </motion.div>

            {/* Row 1: Planned vs Actual + Shrinkage Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold font-heading mb-1">
                  Planned vs Actual Attendance Trend
                </h3>
                <p className="text-[10px] text-muted-foreground mb-4">
                  Compare planned vs actual attendance for selected months
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTrend} barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(25, 22%, 88%)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(0, 0%, 29%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(0, 0%, 29%)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="approved"
                      name="Planned"
                      fill="hsl(152, 69%, 42%)"
                      fillOpacity={0.8}
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                    />
                    <Bar
                      dataKey="rejected"
                      name="Actual"
                      fill="hsl(215, 100%, 58%)"
                      fillOpacity={0.8}
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold font-heading mb-1">
                  Shrinkage % Forecast
                </h3>
                <p className="text-[10px] text-muted-foreground mb-4">
                  Monthly shrinkage with target at {rules.maxDailyPct}%
                </p>
                <div className="space-y-4">
                  {shrinkageForecast.map((m) => (
                    <div key={m.month} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{m.month}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{m.pct}%</span>
                          {m.pct > m.target && (
                            <span className="text-[9px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold border border-destructive/15">
                              Over Target
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={(m.pct / 15) * 100} className="h-3" />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
                          style={{ left: `${(m.target / 15) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: High Risk + Department Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="rounded-xl border border-border bg-card p-3.5 lg:p-4">
                <div className="mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold font-heading">
                    <AlertTriangle size={14} className="text-warning" /> High
                    Risk Dates
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Daily risk details update from the month and date filters
                    above, including shrinkage, leaves taken, pending requests,
                    and forecasted shrinkage.
                  </p>
                </div>

                <div className="scrollbar-hidden max-h-[400px] space-y-2.5 overflow-y-auto pr-1">
                  {highRiskRows.length === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                      No high-risk dates were detected for {selectedMonthLabel}.
                    </div>
                  ) : (
                    highRiskRows.map((item) => (
                      <div
                        key={`risk-${item.date}`}
                        className="rounded-xl border border-border bg-muted/20 p-3.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">
                              {formatDate(item.date)}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              Shrinkage hit {item.shrinkagePct}% • Forecasted
                              shrinkage {item.forecastedShrinkagePct}%
                            </div>
                          </div>
                          <span className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[10px] font-bold text-destructive">
                            High Risk
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs md:grid-cols-4">
                          <div className="rounded-xl border border-border bg-background/80 p-3">
                            <div className="text-muted-foreground">
                              Leaves Taken
                            </div>
                            <div className="mt-1 font-semibold">
                              {item.approvedLeaves}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/80 p-3">
                            <div className="text-muted-foreground">
                              Pending Requests
                            </div>
                            <div className="mt-1 font-semibold">
                              {item.pendingLeaves}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/80 p-3">
                            <div className="text-muted-foreground">
                              Scheduled Guides
                            </div>
                            <div className="mt-1 font-semibold">
                              {item.scheduledGuides}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/80 p-3">
                            <div className="text-muted-foreground">
                              Forecast Volume
                            </div>
                            <div className="mt-1 font-semibold">
                              {item.forecastVolume}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-full">
                <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
                  <Shield size={14} className="text-info" /> Department Risk
                  Analysis
                </h3>
                <p className="text-[10px] text-muted-foreground mb-4">
                  Shrinkage levels across departments
                </p>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {deptRisk.map((d) => (
                    <div key={d.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{d.shrinkage}%</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${d.risk === "High" ? "bg-destructive/10 text-destructive border-destructive/15" : d.risk === "Moderate" ? "bg-warning/10 text-warning border-warning/15" : "bg-success/10 text-success border-success/15"}`}
                          >
                            {d.risk}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={(d.shrinkage / 15) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-border/30 pt-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />{" "}
                      High risk
                    </span>
                    <span className="font-semibold">
                      {deptRisk.filter((d) => d.risk === "High").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />{" "}
                      Moderate risk
                    </span>
                    <span className="font-semibold">
                      {deptRisk.filter((d) => d.risk === "Moderate").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" /> Low
                      risk
                    </span>
                    <span className="font-semibold">
                      {deptRisk.filter((d) => d.risk === "Low").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Status Donut + Treemap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold font-heading mb-1">
                  Status Distribution
                </h3>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Current request breakdown
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} opacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {statusData.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-1.5 text-[9px]"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: s.fill }}
                      />
                      <span className="text-muted-foreground truncate">
                        {s.name}
                      </span>
                      <span className="font-bold ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
                  <Layers size={14} className="text-accent" /> Department
                  Heatmap
                </h3>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Leave volume by department
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {treemapData.slice(0, 6).map((d, i) => (
                    <span
                      key={d.name}
                      className="flex items-center gap-1 text-[8px] text-muted-foreground"
                    >
                      <span
                        className="w-2 h-2 rounded-sm"
                        style={{
                          background: DEPT_COLORS[i % DEPT_COLORS.length],
                        }}
                      />
                      {d.name
                        .replace("Messaging - ", "M-")
                        .replace("Messaging ", "M-")}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    nameKey="name"
                    content={<TreemapContent {...{}} />}
                    animationDuration={400}
                  />
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 4: Dept Efficiency + Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
                  <Target size={14} className="text-info" /> Department
                  Efficiency
                </h3>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Leaves per agent by department
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart
                    data={deptScatter}
                    margin={{ bottom: 20, left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(25, 22%, 88%)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(0, 0%, 29%)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fill: "hsl(0, 0%, 29%)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="leavesPerAgent"
                      name="Leaves/Agent"
                      barSize={20}
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.6}
                    >
                      {deptScatter.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="shrinkage"
                      name="Shrinkage %"
                      stroke="hsl(37, 100%, 58%)"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      dot={{ r: 3, fill: "hsl(37, 100%, 58%)" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Approval Rate Gauge + Quick Metrics */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center">
                  <h3 className="text-sm font-bold font-heading mb-3 flex items-center gap-2">
                    <Target size={14} className="text-primary" /> Approval Rate
                  </h3>
                  <ResponsiveContainer width="100%" height={110}>
                    <RadialBarChart
                      cx="50%"
                      cy="55%"
                      innerRadius="60%"
                      outerRadius="90%"
                      data={[
                        { value: approvalRate, fill: "hsl(152, 69%, 42%)" },
                      ]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: "hsl(25, 22%, 88%)" }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="-mt-4 text-center">
                    <span className="text-2xl font-extrabold text-primary font-heading">
                      {approvalRate}%
                    </span>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {approved} of {decided} decided
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold font-heading flex items-center gap-2">
                    <Zap size={13} className="text-accent" /> Quick Metrics
                  </h3>
                  {[
                    {
                      label: "Avg leaves/agent",
                      value:
                        totalAgents > 0
                          ? (totalLeaves / totalAgents).toFixed(1)
                          : "0",
                      icon: ArrowUpRight,
                      color: "text-info",
                    },
                    {
                      label: "Rejection rate",
                      value:
                        decided > 0
                          ? `${Math.round((rejected / decided) * 100)}%`
                          : "0%",
                      icon: ArrowDownRight,
                      color: "text-destructive",
                    },
                    {
                      label: "Swap/Transfer",
                      value: `${filteredLeaves.filter((l) => l.type === "Swap" || l.type === "Transfer").length}`,
                      icon: Activity,
                      color: "text-accent",
                    },
                    {
                      label: "Pending queue",
                      value: `${pendingCount + peerPending}`,
                      icon: Clock,
                      color: "text-warning",
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <m.icon size={11} className={m.color} />
                        <span className="text-[10px] text-muted-foreground">
                          {m.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Recommendations */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold font-heading mb-4 flex items-center gap-2">
                <Target size={14} className="text-primary" /> System
                Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${rec.severity === "high" ? "bg-destructive" : rec.severity === "medium" ? "bg-warning" : "bg-info"}`}
                        />
                        <span className="text-xs font-bold">{rec.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-4">
                        {rec.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="text-[10px] bg-success/10 text-success px-3 py-1.5 rounded-lg font-bold border border-success/15 hover:bg-success/20 transition-colors flex items-center gap-1">
                        <CheckCircle size={10} /> Accept
                      </button>
                      <button className="text-[10px] bg-muted/40 text-muted-foreground px-3 py-1.5 rounded-lg font-bold border border-border hover:bg-muted/60 transition-colors flex items-center gap-1">
                        <Eye size={10} /> Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm font-bold font-heading">
                  Department Breakdown
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {deptBreakdown.length} departments
                </p>
              </div>
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto scrollbar-hidden">
                <table className="w-full text-[11px] premium-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Department</th>
                      <th>Agents</th>
                      <th>Total Request</th>
                      <th>Unplanned</th>
                      <th>Approved</th>
                      <th>Rejected</th>
                      <th>Pending</th>
                      <th>Avg/Agent</th>
                      <th>Shrinkage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptBreakdown.map((d, i) => (
                      <motion.tr
                        key={d.dept}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`cursor-pointer ${deptFilter === d.id ? "bg-primary/5" : "hover:bg-muted/20"}`}
                        onClick={() =>
                          setDeptFilter(deptFilter === d.id ? "all" : d.id)
                        }
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                background: DEPT_COLORS[i % DEPT_COLORS.length],
                              }}
                            />
                            <span className="font-semibold">{d.dept}</span>
                          </div>
                        </td>
                        <td>{d.agents}</td>
                        <td className="font-bold">{d.leaves}</td>
                        <td className="text-info font-semibold">
                          {d.unplanned}
                        </td>
                        <td className="text-success font-semibold">
                          {d.approved}
                        </td>
                        <td className="text-destructive font-semibold">
                          {d.rejected}
                        </td>
                        <td>
                          {d.pending > 0 ? (
                            <span className="text-warning font-bold">
                              {d.pending}
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>
                        <td>{d.avgPerAgent}</td>
                        <td className="font-semibold">{d.shrinkage}%</td>
                        <td>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${d.shrinkage > 8 ? "bg-warning/10 text-warning border-warning/15" : d.shrinkage > 5 ? "bg-info/10 text-info border-info/15" : "bg-success/10 text-success border-success/15"}`}
                          >
                            {d.shrinkage > 8
                              ? "Critical"
                              : d.shrinkage > 5
                                ? "Watch"
                                : "Healthy"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Day-wise Insights Tab */}
          <TabsContent value="daywise" className="mt-6">
            {/* Filter Toolbar */}
            <div className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-primary" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="glass-input w-auto min-w-[180px] py-2 text-xs"
                >
                  <option value="all">
                    All Departments ({departments.length})
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border">
                {["jan", "feb", "mar", "apr"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${timeRange === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t === "apr" ? "apr" : t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                <input
                  type="month"
                  value={selectedMonth.substring(0, 7)}
                  onChange={(e) => setSelectedMonth(e.target.value + "-01")}
                  className="glass-input w-auto py-2 text-xs"
                />
              </div>
              <div className="relative flex-1 max-w-[180px]"></div>
              <span className="text-[10px] text-muted-foreground md:ml-auto flex items-center gap-1.5">
                <Building2 size={11} />{" "}
                <strong className="text-foreground">{selectedDeptName}</strong>
              </span>
            </div>
            {/* Day-wise KPI Cards */}
            <motion.div
              {...staggerContainer}
              initial="initial"
              animate="animate"
              className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"
            >
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Forecast Accuracy"
                  value="94.3%"
                  icon={<Target size={18} />}
                  accent="success"
                  subtitle="Forecasted shrinkage%"
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Shrinkage %"
                  value={`${shrinkageSummary.overallShrinkagePct}%`}
                  icon={<Gauge size={18} />}
                  accent={
                    shrinkageSummary.overallShrinkagePct > rules.maxDailyPct
                      ? "warning"
                      : "info"
                  }
                  subtitle={`Planned ${shrinkageSummary.plannedShrinkagePct}% • Unplanned ${shrinkageSummary.unplannedShrinkagePct}%`}
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Production Hours"
                  value={`${selectedMonthHours.actualHours}/${selectedMonthHours.targetHours}`}
                  icon={<Calendar size={18} />}
                  accent="primary"
                  subtitle={`${selectedMonthLabel} actual vs planned team hours`}
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="High Risk Days"
                  value={`${highRiskRows.length}d`}
                  icon={<AlertTriangle size={18} />}
                  accent="warning"
                  subtitle={`For ${selectedMonthLabel} `}
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <KpiCard
                  label="Total Leaves"
                  value={`${plannedLeaveCount + unplannedLeaveCount}`}
                  icon={<TrendingUp size={18} />}
                  accent="primary"
                  subtitle={`PL- ${plannedLeaveCount} • UL- ${unplannedLeaveCount}`}
                />
              </motion.div>
            </motion.div>

            {/* Shrinkage % Forecast Calendar */}
            <div className="self-start rounded-xl border border-border bg-card p-3.5 lg:p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold font-heading">
                    Shrinkage % Forecast
                  </h3>
                  <p className="text-[9px] leading-5 text-muted-foreground">
                    Day-wise shrinkage outlook for the current team in{" "}
                    {forecastMonthLabel}. Check {forecastNextMonthLabel} next
                    for the forecasted shrinkage calculation for the entire
                    team.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  <button
                    onClick={() => handleForecastMonthStep(-1)}
                    className="rounded-xl border border-border p-1.5 transition-colors hover:bg-muted/30"
                    aria-label="Previous month in shrinkage forecast"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <input
                    type="month"
                    value={forecastMonthKey}
                    onChange={(event) =>
                      setForecastMonthKey(event.target.value)
                    }
                    className="glass-input w-[138px] px-3 py-2 text-sm"
                  />

                  <button
                    onClick={() => handleForecastMonthStep(1)}
                    className="rounded-xl border border-border p-1.5 transition-colors hover:bg-muted/30"
                    aria-label="Next month in shrinkage forecast"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={`forecast-day-${day}`} className="py-1">
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: forecastCalendarOffset }).map(
                  (_, index) => (
                    <div
                      key={`forecast-empty-${index}`}
                      className="min-h-[86px] rounded-lg bg-muted/10"
                    />
                  ),
                )}

                {forecastCalendarDays.map((day) => {
                  const dayKey = toDateStr(day);
                  const item = dailyMetricsByDate[dayKey];
                  const isToday = dayKey === todayKey;
                  const isPreviousDay = dayKey === previousDay;
                  const dayCardClass = isToday
                    ? "border-red-500 bg-background/95 text-foreground shadow-sm ring-1 ring-red-100"
                    : item?.isHighRisk
                      ? "border-amber-500 bg-background/95 text-foreground shadow-sm"
                      : isPreviousDay
                        ? "border-sky-500 bg-background/95 text-foreground shadow-sm"
                        : "border-border bg-background/95 text-foreground shadow-sm";
                  const subtleTextClass = "font-medium text-muted-foreground";
                  const metricCardClass =
                    "border-border bg-muted/20 text-foreground";

                  return (
                    <div
                      key={`forecast-mini-${dayKey}`}
                      className={`min-h-[104px] rounded-lg border px-1.5 py-1.5 ${dayCardClass}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-[10px] font-bold">
                          {day.getDate()}
                        </div>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold ${
                            isToday
                              ? "border border-red-200 bg-red-50 text-red-700"
                              : item?.isHighRisk
                                ? "border border-amber-200 bg-amber-50 text-amber-700"
                                : isPreviousDay
                                  ? "border border-sky-200 bg-sky-50 text-sky-700"
                                  : "border border-border bg-muted/20 text-muted-foreground"
                          }`}
                        >
                          {isToday
                            ? "Today"
                            : item?.isHighRisk
                              ? "Risk"
                              : isPreviousDay
                                ? "Previous day"
                                : day.toLocaleDateString("en-US", {
                                    weekday: "short",
                                  })}
                        </span>
                      </div>
                      {item ? (
                        <div className="mt-1.5 space-y-1 text-[7px] leading-tight">
                          <div
                            className={`rounded-md border px-1.5 py-1 ${metricCardClass}`}
                          >
                            <div className={subtleTextClass}>
                              Forecast Shrinkage %
                            </div>
                            <div className="mt-0.5 text-[10px] font-black">
                              {item.forecastedShrinkagePct}%
                            </div>
                          </div>
                          <div
                            className={`rounded-md border px-1.5 py-1 ${metricCardClass}`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className={subtleTextClass}>PL</span>
                                <span className="font-semibold">
                                  {item.plannedLeaves}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className={subtleTextClass}>UPL</span>
                                <span className="font-semibold">
                                  {item.unplannedLeaves}
                                </span>
                              </div>
                              {/* <div className="flex items-center justify-between gap-1">
                               <span className={subtleTextClass}>Swap</span>
                               <span className="font-semibold">{item.weekoffSwapCount}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                               <span className={subtleTextClass}>Move</span>
                               <span className="font-semibold">{item.weekoffMoveCount}</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-[8px] text-muted-foreground/50">
                          No data
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> High
                  risk
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-700" />
                  PL-Planned Leave
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  UPL- Unplanned leaves
                </span>
              </div>
            </div>
            {/* Day-wise Overview Cards - Supervisor Analytics Style */}
            <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 mb-6 mt-6">
              {/* Planned vs Actual Attendance Trend */}
              <div className="self-start rounded-xl border border-border bg-card p-3">
                <div className="mb-8">
                  <h3 className="text-sm font-bold font-heading">
                    Planned vs Actual Attendance Trend
                  </h3>
                  <p className="text-[8px] text-muted-foreground">
                    Month-wise attendance view across all departments, including
                    variance.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
                  {monthlyTrend.map((item) => (
                    <div
                      key={`attendance-${item.month}`}
                      className="rounded-xl border border-border bg-background/80 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">
                            {item.month}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Planned {item.approved} • Actual {item.rejected}
                          </div>
                        </div>
                        <div
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                            item.rejected - item.approved < 0
                              ? "border-warning/20 bg-warning/10 text-warning"
                              : "border-success/20 bg-success/10 text-success"
                          }`}
                        >
                          {item.rejected - item.approved < 0 ? "-" : "+"}
                          {Math.abs(item.rejected - item.approved)}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2.5 text-[11px]">
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              Planned
                            </span>
                            <span className="font-semibold">
                              {item.approved}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/25">
                            <div
                              className="h-2 rounded-full bg-primary/75"
                              style={{
                                width: `${Math.max(16, (item.approved / monthlyTrend[0]?.total || 100) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              Actual
                            </span>
                            <span className="font-semibold">
                              {item.rejected}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/25">
                            <div
                              className="h-2 rounded-full bg-success/80"
                              style={{
                                width: `${Math.max(16, (item.rejected / monthlyTrend[0]?.total || 100) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                          <div className="text-muted-foreground">Variance</div>
                          <div className="mt-1 font-semibold">
                            {item.rejected - item.approved}
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                          <div className="text-muted-foreground">
                            Variance %
                          </div>
                          <div className="mt-1 font-semibold">
                            {(
                              ((item.rejected - item.approved) /
                                item.approved) *
                                100 || 0
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team/Department Risk Analysis */}
              <div className="self-start rounded-xl border border-border bg-card p-3.5 lg:p-4">
                <div className="mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold font-heading">
                    <Users size={14} className="text-info" /> Team Risk Analysis
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Daily metrics: shrinkage, forecast volume, and
                    across-department analysis.
                  </p>
                </div>

                <div className="scrollbar-hidden max-h-[680px] space-y-2.5 overflow-y-auto pr-1">
                  {deptBreakdown.slice(0, 7).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-muted/20 p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">
                            {item.dept}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Leaves: {item.approved} Approved • {item.leaves}{" "}
                            Total • {item.shrinkage}% Shrinkage
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                            item.shrinkage > 8
                              ? "border-destructive/20 bg-destructive/10 text-destructive"
                              : item.shrinkage > 5
                                ? "border-warning/20 bg-warning/10 text-warning"
                                : "border-success/20 bg-success/10 text-success"
                          }`}
                        >
                          {item.shrinkage > 8
                            ? "High"
                            : item.shrinkage > 5
                              ? "Moderate"
                              : "Low"}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Progress
                          value={Math.min(100, item.shrinkage * 4)}
                          className="h-2.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-5 rounded-xl border border-border bg-card p-3.5 lg:p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold font-heading">
                    Performance Analytics
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Calendar-wise daily view of shrinkage percentage, forecast
                    volume, scheduled guides, and required guides. The current
                    day is highlighted, the previous day is softly marked, and
                    high-risk dates are highlighted stronger.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMonthStep(-1)}
                    className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                    aria-label="Previous month in performance analytics"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="min-w-[170px] rounded-xl border border-border bg-muted/20 px-4 py-2 text-center text-sm font-semibold">
                    {selectedMonthLabel}
                  </div>
                  <button
                    onClick={() => handleMonthStep(1)}
                    className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                    aria-label="Next month in performance analytics"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day} className="py-1.5">
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: performanceCalendarOffset }).map(
                  (_, index) => (
                    <div
                      key={`calendar-empty-${index}`}
                      className="min-h-[108px] rounded-xl bg-muted/10"
                    />
                  ),
                )}

                {performanceCalendarDays.map((day) => {
                  const dayKey = toDateStr(day);
                  const item = dailyMetricsByDate[dayKey];
                  const isToday = dayKey === todayKey;
                  const isPreviousDay = dayKey === previousDay;
                  const performanceCardClass = isToday
                    ? "border-red-500 bg-background/95 text-foreground shadow-sm ring-1 ring-red-100"
                    : item?.isHighRisk
                      ? "border-amber-500 bg-background/95 text-foreground shadow-sm"
                      : isPreviousDay
                        ? "border-sky-500 bg-background/95 text-foreground shadow-sm"
                        : "border-border bg-background/95 text-foreground shadow-sm";
                  const performanceMetricClass =
                    "border-border bg-muted/20 text-foreground";

                  return (
                    <div
                      key={dayKey}
                      className={`min-h-[96px] rounded-xl border p-2 ${performanceCardClass}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-bold">{day.getDate()}</div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isToday
                              ? "border border-red-200 bg-red-50 text-red-700"
                              : item?.isHighRisk
                                ? "border border-amber-200 bg-amber-50 text-amber-700"
                                : isPreviousDay
                                  ? "border border-sky-200 bg-sky-50 text-sky-700"
                                  : "border border-border bg-muted/20 text-muted-foreground"
                          }`}
                        >
                          {isToday
                            ? "Today"
                            : item?.isHighRisk
                              ? "Risk"
                              : isPreviousDay
                                ? "Previous day"
                                : day.toLocaleDateString("en-US", {
                                    weekday: "short",
                                  })}
                        </span>
                      </div>

                      {item ? (
                        <div className="mt-2 space-y-1 text-[9px]">
                          <div
                            className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}
                          >
                            Shrinkage % :{" "}
                            <span className="font-semibold">
                              {item.shrinkagePct}%
                            </span>
                          </div>
                          <div
                            className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}
                          >
                            Forecast Volumes :{" "}
                            <span className="font-semibold">
                              {item.forecastVolume}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}
                          >
                            Required Guides :{" "}
                            <span className="font-semibold">
                              {item.requiredGuides}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}
                          >
                            Scheduled Guides :{" "}
                            <span className="font-semibold">
                              {item.scheduledGuides}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 text-[10px] text-muted-foreground/50">
                          No team data
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden bg-background/85 backdrop-blur-sm"
          >
            <div className="h-full w-full overflow-hidden p-4 md:p-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:h-[calc(100vh-3rem)]"
              >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-bold font-heading">
                      <Bot size={18} className="text-primary" /> Analytics Chat
                      bot
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Last 5 days of chat history are kept in this view. Dummy
                      history is preloaded for now.
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                    aria-label="Close chatbot"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="flex min-h-0 flex-col overflow-hidden border-b border-border bg-muted/20 p-5 md:border-b-0 md:border-r">
                    <div className="mb-4 flex items-center gap-2 text-sm font-bold font-heading">
                      <Clock size={14} className="text-info" /> Recent Chat
                      History
                    </div>
                    <div className="scrollbar-hidden min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {Object.entries(chatHistoryByDay)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([day, messages]) => (
                          <div
                            key={day}
                            className="rounded-xl border border-border bg-background/80 p-4"
                          >
                            <div className="text-xs font-semibold">
                              {formatDate(day)}
                            </div>
                            <div className="mt-2 space-y-2">
                              {messages.slice(-3).map((message) => (
                                <div
                                  key={message.id}
                                  className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground"
                                >
                                  <span className="font-semibold text-foreground">
                                    {message.sender === "assistant"
                                      ? "Bot"
                                      : "You"}
                                    :
                                  </span>{" "}
                                  {message.text}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col overflow-hidden">
                    <div className="scrollbar-hidden min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                      {pruneChatHistory(chatMessages, today).map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-3xl rounded-2xl border px-4 py-3 text-sm ${
                            message.sender === "assistant"
                              ? "border-border bg-muted/20 text-foreground"
                              : "ml-auto border-primary/20 bg-primary/10 text-foreground"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {message.sender === "assistant" ? (
                              <MessageSquare size={11} />
                            ) : (
                              <Users size={11} />
                            )}
                            {message.sender === "assistant"
                              ? "Analytics Bot"
                              : "You"}
                          </div>
                          <div>{message.text}</div>
                        </div>
                      ))}
                      {isBotTyping ? (
                        <div className="max-w-3xl rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground">
                          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            <MessageSquare size={11} /> Analytics Bot
                          </div>
                          <div className="text-muted-foreground">
                            Reviewing the latest supervisor analytics…
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="border-t border-border px-6 py-4">
                      <div className="mb-2 text-xs text-muted-foreground">
                        Ask about high-risk dates, team shrinkage, production
                        gaps, or week-off movement recommendations.
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <textarea
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleSendChat();
                            }
                          }}
                          rows={3}
                          className="glass-input min-w-0 flex-1 resize-none text-sm"
                          placeholder="Type a question for the analytics bot..."
                        />

                        <button
                          onClick={handleSendChat}
                          className="inline-flex h-fit items-center justify-center gap-2 rounded-xl btn-primary-gradient px-5 py-3 text-sm font-bold text-primary-foreground"
                        >
                          <Send size={14} /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
