import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import KpiCard from '@/components/kpis/KpiCard';
import SectionHeader from '@/components/SectionHeader';
import { Progress } from '@/components/ui/progress';
import { estimateForecastVolume, estimateRequiredGuides, countScheduledGuidesForDepartment } from '@/core/utils/forecast';
import { formatDate, formatMonthYear, getMonthKey, toDateStr } from '@/core/utils/dates';
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
} from 'lucide-react';

type RangePreset = 1 | 3 | 6 | 'custom';
type ChatSender = 'assistant' | 'user';

interface DailyTeamMetric {
  date: string;
  scheduledGuides: number;
  requiredGuides: number;
  forecastVolume: number;
  approvedLeaves: number;
  pendingLeaves: number;
  activeLeaves: number;
  plannedLeaves: number;
  unplannedLeaves: number;
  plannedShrinkagePct: number;
  unplannedShrinkagePct: number;
  shrinkagePct: number;
  availableGuides: number;
  forecastedShrinkagePct: number;
  weekoffSwapCount: number;
  weekoffMoveCount: number;
  isHighRisk: boolean;
}

interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
}

const ACTIVE_REQUEST_STATUSES = ['Approved', 'PendingSupervisor', 'PendingPeer', 'Submitted'] as const;
const PENDING_REQUEST_STATUSES = ['PendingSupervisor', 'PendingPeer', 'Submitted'] as const;
const ACTIVE_WEEKOFF_STATUSES = ['Approved', 'PendingAdmin'] as const;
const CHAT_HISTORY_STORAGE_KEY = 'supervisor-analytics-chat-history-v1';
const CHAT_REPLY_DELAY_MS = 250;

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getMonthStart(monthKey: string) {
  return parseDate(`${monthKey}-01`);
}

function getMonthEnd(monthKey: string) {
  const monthStart = getMonthStart(monthKey);
  return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getDateKey(date: Date) {
  return toDateStr(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
}

function getDatesBetween(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const dates: string[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    dates.push(getDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getMonthKeysBetween(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const months: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    months.push(getMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function getCalendarDays(monthKey: string) {
  const monthStart = getMonthStart(monthKey);
  const monthEnd = getMonthEnd(monthKey);
  const days: Date[] = [];
  const cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function formatShortDate(date: string) {
  return parseDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatVariance(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

function buildChatSeed(today: Date, departmentName: string) {
  return Array.from({ length: 5 }, (_, index) => {
    const offsetDate = new Date(today);
    offsetDate.setDate(offsetDate.getDate() - (4 - index));
    const createdAt = `${getDateKey(offsetDate)}T09:1${index}:00.000Z`;
    const responseAt = `${getDateKey(offsetDate)}T09:2${index}:00.000Z`;

    return [
      {
        id: `seed-user-${index}`,
        sender: 'user' as const,
        text: index % 2 === 0
          ? `Show me the highest shrinkage dates for ${departmentName}.`
          : 'Do we have any safe week-off movement options this month?',
        createdAt,
      },
      {
        id: `seed-assistant-${index}`,
        sender: 'assistant' as const,
        text: index % 2 === 0
          ? `The top forecast pressure is concentrated in the current month risk window. Review the red-highlighted dates and compare scheduled guides against required guides before approving more leave.`
          : `There are low-impact days in the planner where week-off movement can be reviewed first, then week-off swaps can be used if daily availability still stays above the required guide count.`,
        createdAt: responseAt,
      },
    ];
  }).flat();
}

function pruneChatHistory(messages: ChatMessage[], today: Date) {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 4);
  cutoff.setHours(0, 0, 0, 0);

  return messages
    .filter(message => new Date(message.createdAt) >= cutoff)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function groupConsecutiveRiskDates(rows: DailyTeamMetric[]) {
  if (rows.length === 0) return [];

  const spans: Array<{ start: string; end: string; days: number }> = [];
  let currentSpan = { start: rows[0].date, end: rows[0].date, days: 1 };

  for (let index = 1; index < rows.length; index += 1) {
    const previous = parseDate(rows[index - 1].date);
    const current = parseDate(rows[index].date);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

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

export default function SupervisorAnalytics() {
  const { leaves, schedule, rules, currentUser, users, departments, attendance, weekoffSwapRequests } = useAppStore();
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateStr(today);
  const previousDay = useMemo(() => {
    const value = new Date(today);
    value.setDate(value.getDate() - 1);
    return toDateStr(value);
  }, [today]);
  const deptId = currentUser?.departmentId ?? 'd1';
  const myDept = departments.find(department => department.id === deptId);
  const initialMonthKey = getMonthKey(today);

  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);
  const [rangePreset, setRangePreset] = useState<RangePreset>(1);
  const [forecastMonthKey, setForecastMonthKey] = useState(initialMonthKey);
  const [dateFrom, setDateFrom] = useState(toDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [dateTo, setDateTo] = useState(toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0)));
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    if (rangePreset === 'custom') return;
    const selectedMonthDate = getMonthStart(selectedMonthKey);
    const rangeStart = addMonths(selectedMonthDate, -(rangePreset - 1));
    setDateFrom(toDateStr(rangeStart));
    setDateTo(toDateStr(getMonthEnd(selectedMonthKey)));
  }, [selectedMonthKey, rangePreset]);

  useEffect(() => {
    setForecastMonthKey(selectedMonthKey);
  }, [selectedMonthKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    const seed = buildChatSeed(today, myDept?.name ?? 'your department');

    try {
      const parsed = stored ? JSON.parse(stored) as ChatMessage[] : seed;
      const pruned = pruneChatHistory(parsed, today);
      setChatMessages(pruned);
      window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(pruned));
    } catch {
      const pruned = pruneChatHistory(seed, today);
      setChatMessages(pruned);
      window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(pruned));
    }
  }, [today, myDept?.name]);

  useEffect(() => {
    if (typeof window === 'undefined' || chatMessages.length === 0) return;
    window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(pruneChatHistory(chatMessages, today)));
  }, [chatMessages, today]);

  const teamAgents = useMemo(
    () => users.filter(user => user.role === 'agent' && user.departmentId === deptId).sort((a, b) => a.name.localeCompare(b.name)),
    [users, deptId],
  );
  const teamAgentIds = useMemo(() => new Set(teamAgents.map(agent => agent.id)), [teamAgents]);
  const deptLeaves = useMemo(
    () => leaves.filter(leave => leave.departmentId === deptId),
    [leaves, deptId],
  );
  const deptWeekoffRequests = useMemo(
    () => weekoffSwapRequests.filter(
      request =>
        request.departmentId === deptId &&
        ACTIVE_WEEKOFF_STATUSES.includes(request.status as (typeof ACTIVE_WEEKOFF_STATUSES)[number]),
    ),
    [weekoffSwapRequests, deptId],
  );
  const deptAttendance = useMemo(
    () => attendance.filter(item => teamAgentIds.has(item.userId)),
    [attendance, teamAgentIds],
  );
  const periodDates = useMemo(() => getDatesBetween(dateFrom, dateTo), [dateFrom, dateTo]);
  const selectedMonthDates = useMemo(() => getCalendarDays(selectedMonthKey).map(day => toDateStr(day)), [selectedMonthKey]);
  const forecastMonthDates = useMemo(() => getCalendarDays(forecastMonthKey).map(day => toDateStr(day)), [forecastMonthKey]);
  const datesToBuild = useMemo(
    () => Array.from(new Set([...periodDates, ...selectedMonthDates, ...forecastMonthDates])).sort((a, b) => a.localeCompare(b)),
    [periodDates, selectedMonthDates, forecastMonthDates],
  );

  const dailyMetricsByDate = useMemo(() => {
    return datesToBuild.reduce<Record<string, DailyTeamMetric>>((acc, date) => {
      const scheduledGuides = countScheduledGuidesForDepartment(date, deptId, schedule, users);
      const dayLeaves = deptLeaves.filter(
        leave => leave.date === date && ACTIVE_REQUEST_STATUSES.includes(leave.status as (typeof ACTIVE_REQUEST_STATUSES)[number]),
      );
      const approvedLeaves = dayLeaves.filter(leave => leave.status === 'Approved').reduce((total, leave) => total + leave.days, 0);
      const pendingLeaves = dayLeaves.filter(
        leave => PENDING_REQUEST_STATUSES.includes(leave.status as (typeof PENDING_REQUEST_STATUSES)[number]),
      ).reduce((total, leave) => total + leave.days, 0);
      const plannedLeaves = dayLeaves.filter(leave => leave.type === 'Planned').reduce((total, leave) => total + leave.days, 0);
      const unplannedLeaves = dayLeaves.filter(leave => leave.type === 'Unplanned').reduce((total, leave) => total + leave.days, 0);
      const weekoffSwapCount = deptWeekoffRequests.filter(request => {
        const mode = request.mode ?? 'WeekSwap';
        if (mode === 'WeekMove') return false;
        return request.sourceDate === date || request.peerDate === date;
      }).length;
      const weekoffMoveCount = deptWeekoffRequests.filter(request => {
        const mode = request.mode ?? 'WeekSwap';
        return mode === 'WeekMove' && request.peerDate === date;
      }).length;
      const activeLeaves = approvedLeaves + pendingLeaves;
      const forecastVolume = estimateForecastVolume(date);
      const requiredGuides = estimateRequiredGuides(date);
      const availableGuides = Math.max(0, scheduledGuides - activeLeaves);
      const shrinkagePct = scheduledGuides === 0 ? 0 : round1((activeLeaves / scheduledGuides) * 100);
      const plannedShrinkagePct = scheduledGuides === 0 ? 0 : round1((plannedLeaves / scheduledGuides) * 100);
      const unplannedShrinkagePct = scheduledGuides === 0 ? 0 : round1((unplannedLeaves / scheduledGuides) * 100);
      const coverageGap = Math.max(0, requiredGuides - availableGuides);
      const forecastedShrinkagePct = scheduledGuides === 0
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
        isHighRisk: availableGuides < requiredGuides || shrinkagePct >= rules.maxDailyPct,
      };

      return acc;
    }, {});
  }, [datesToBuild, deptId, schedule, users, deptLeaves, deptWeekoffRequests, rules.maxDailyPct]);

  const selectedMonthMetrics = useMemo(
    () => selectedMonthDates.map(date => dailyMetricsByDate[date]).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)),
    [selectedMonthDates, dailyMetricsByDate],
  );
  const periodMetrics = useMemo(
    () => periodDates.map(date => dailyMetricsByDate[date]).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)),
    [periodDates, dailyMetricsByDate],
  );

  const selectedMonthLabel = formatMonthYear(selectedMonthKey);
  const forecastMonthLabel = formatMonthYear(forecastMonthKey);
  const forecastNextMonthLabel = formatMonthYear(addMonths(getMonthStart(forecastMonthKey), 1));
  const rangeMonthKeys = useMemo(() => getMonthKeysBetween(dateFrom, dateTo), [dateFrom, dateTo]);
  const selectedRangeMonths = useMemo(
    () => {
      if (rangePreset === 'custom') {
        return rangeMonthKeys.map(monthKey => ({ key: monthKey, label: formatMonthYear(monthKey) }));
      }

      return Array.from({ length: rangePreset }, (_, index) => {
        const monthDate = addMonths(getMonthStart(selectedMonthKey), -((rangePreset as number) - 1) + index);
        const monthKey = formatMonthInput(monthDate);
        return { key: monthKey, label: formatMonthYear(monthKey) };
      });
    },
    [rangeMonthKeys, rangePreset, selectedMonthKey],
  );

  const shrinkageSummary = useMemo(() => {
    const totalScheduled = periodMetrics.reduce((total, item) => total + item.scheduledGuides, 0);
    const totalPlannedLeaves = periodMetrics.reduce((total, item) => total + item.plannedLeaves, 0);
    const totalUnplannedLeaves = periodMetrics.reduce((total, item) => total + item.unplannedLeaves, 0);
    const totalActiveLeaves = periodMetrics.reduce((total, item) => total + item.activeLeaves, 0);

    return {
      totalScheduled,
      totalActiveLeaves,
      overallShrinkagePct: totalScheduled === 0 ? 0 : round1((totalActiveLeaves / totalScheduled) * 100),
      plannedShrinkagePct: totalScheduled === 0 ? 0 : round1((totalPlannedLeaves / totalScheduled) * 100),
      unplannedShrinkagePct: totalScheduled === 0 ? 0 : round1((totalUnplannedLeaves / totalScheduled) * 100),
    };
  }, [periodMetrics]);

  const selectedMonthHours = useMemo(() => {
    const targetHours = selectedMonthMetrics.reduce((total, item) => total + (item.scheduledGuides * 8), 0);
    const actualHours = Math.max(0, targetHours - (selectedMonthMetrics.reduce((total, item) => total + item.approvedLeaves, 0) * 8));
    return {
      targetHours,
      actualHours,
      deficitHours: Math.max(0, targetHours - actualHours),
    };
  }, [selectedMonthMetrics]);

  const currentMonthLeaves = useMemo(
    () => deptLeaves.filter(leave => leave.date.startsWith(selectedMonthKey) && ACTIVE_REQUEST_STATUSES.includes(leave.status as (typeof ACTIVE_REQUEST_STATUSES)[number])),
    [deptLeaves, selectedMonthKey],
  );
  const plannedLeaveCount = currentMonthLeaves.filter(leave => leave.type === 'Planned').reduce((total, leave) => total + leave.days, 0);
  const unplannedLeaveCount = currentMonthLeaves.filter(leave => leave.type === 'Unplanned').reduce((total, leave) => total + leave.days, 0);

  const highRiskRows = useMemo(
    () => selectedMonthMetrics
      .filter(item => item.isHighRisk)
      .sort((a, b) => b.forecastedShrinkagePct - a.forecastedShrinkagePct || a.date.localeCompare(b.date)),
    [selectedMonthMetrics],
  );

  const monthlyAttendanceTrend = useMemo(() => {
    return rangeMonthKeys.map(monthKey => {
      const monthPlanned = schedule.filter(
        row =>
          teamAgentIds.has(row.userId) &&
          row.date.startsWith(monthKey) &&
          row.date >= dateFrom &&
          row.date <= dateTo &&
          !row.weekOff,
      ).length;

      const monthApprovedLeaves = deptLeaves.filter(
        leave => leave.date.startsWith(monthKey) && leave.date >= dateFrom && leave.date <= dateTo && leave.status === 'Approved',
      ).reduce((total, leave) => total + leave.days, 0);

      const approvedLeaveKeys = new Set(
        deptLeaves
          .filter(leave => leave.date.startsWith(monthKey) && leave.date >= dateFrom && leave.date <= dateTo && leave.status === 'Approved')
          .map(leave => `${leave.requesterId}-${leave.date}`),
      );

      const recordedAbsenceDays = deptAttendance.filter(
        row =>
          !row.present &&
          row.date.startsWith(monthKey) &&
          row.date >= dateFrom &&
          row.date <= dateTo &&
          !approvedLeaveKeys.has(`${row.userId}-${row.date}`),
      ).length;

      const actual = Math.max(0, monthPlanned - monthApprovedLeaves - recordedAbsenceDays);
      const variance = actual - monthPlanned;
      const variancePct = monthPlanned === 0 ? 0 : round1((variance / monthPlanned) * 100);

      return {
        monthKey,
        label: formatMonthYear(monthKey),
        planned: monthPlanned,
        actual,
        variance,
        variancePct,
      };
    });
  }, [rangeMonthKeys, schedule, teamAgentIds, dateFrom, dateTo, deptLeaves, deptAttendance]);

  const teamRiskRows = useMemo(() => {
    return teamAgents
      .map(agent => {
        const agentLeaves = deptLeaves.filter(
          leave => leave.requesterId === agent.id && leave.date.startsWith(selectedMonthKey) && leave.status === 'Approved',
        );
        const planned = agentLeaves.filter(leave => leave.type === 'Planned').reduce((total, leave) => total + leave.days, 0);
        const unplanned = agentLeaves.filter(leave => leave.type === 'Unplanned').reduce((total, leave) => total + leave.days, 0);
        const approved = planned + unplanned;
        const scheduledDays = schedule.filter(
          row => row.userId === agent.id && row.date.startsWith(selectedMonthKey) && !row.weekOff,
        ).length;
        const leavePct = scheduledDays === 0 ? 0 : round1((approved / scheduledDays) * 100);

        return {
          id: agent.id,
          name: agent.name,
          approved,
          planned,
          unplanned,
          leavePct,
          riskLabel: leavePct >= 16 ? 'High' : leavePct >= 10 ? 'Moderate' : 'Low',
        };
      })
      .sort((a, b) => b.leavePct - a.leavePct || b.approved - a.approved);
  }, [teamAgents, deptLeaves, selectedMonthKey, schedule]);

  const riskSpans = useMemo(
    () => groupConsecutiveRiskDates([...highRiskRows].sort((a, b) => a.date.localeCompare(b.date))),
    [highRiskRows],
  );

  const weekoffOpportunity = useMemo(() => {
    for (const riskRow of [...highRiskRows].sort((a, b) => b.shrinkagePct - a.shrinkagePct)) {
      for (const agent of teamAgents) {
        const riskDay = schedule.find(row => row.userId === agent.id && row.date === riskRow.date);
        if (!riskDay?.weekOff) continue;

        for (const candidate of selectedMonthMetrics) {
          if (candidate.date === riskRow.date) continue;
          const candidateDay = schedule.find(row => row.userId === agent.id && row.date === candidate.date);
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

  const recommendations = useMemo(() => {
    const items = [];

    if (highRiskRows.length > 0) {
      const primarySpan = riskSpans[0] ?? { start: highRiskRows[0].date, end: highRiskRows[0].date, days: 1 };
      items.push({
        key: 'forecast-risk',
        title: 'Forecasted risk window',
        description: `${formatShortDate(primarySpan.start)}${primarySpan.start !== primarySpan.end ? ` to ${formatShortDate(primarySpan.end)}` : ''} is the highest-risk date range for ${selectedMonthLabel}. Review approvals closely on these dates because the team forecast stays above the comfortable shrinkage band.`,
        severity: 'high' as const,
      });
    }

    if (productionRecommendation.leavesToReduce > 0) {
      items.push({
        key: 'production-gap',
        title: 'Protect production hours',
        description: `Based on ${plannedLeaveCount} planned leave day(s), ${unplannedLeaveCount} unplanned leave day(s), and the current monthly leave load, the team falls short by ${productionRecommendation.deficitHours} production hours. To recover the target, reduce approvals by about ${productionRecommendation.leavesToReduce} leave day(s) in ${selectedMonthLabel}.`,
        severity: 'medium' as const,
      });
    }

    if (weekoffOpportunity) {
      items.push({
        key: 'weekoff-move',
        title: 'Use week-off movement before declining leave',
        description: `${weekoffOpportunity.agentName} can be reviewed for week-off movement from ${formatShortDate(weekoffOpportunity.riskDate)} to ${formatShortDate(weekoffOpportunity.targetDate)} because availability stays covered on the target day. Review the 7th day login rule in the planner before applying the movement.`,
        severity: 'low' as const,
      });
    } else {
      items.push({
        key: 'weekoff-swap',
        title: 'Alternative coverage options',
        description: 'Week-off movement or week-off swap can still be reviewed as alternatives where they do not reduce same-day availability. Use the Team Schedule planner to validate week-off changes before approving more leave on high-risk days.',
        severity: 'low' as const,
      });
    }

    return items;
  }, [
    highRiskRows,
    riskSpans,
    selectedMonthLabel,
    plannedLeaveCount,
    unplannedLeaveCount,
    productionRecommendation,
    weekoffOpportunity,
  ]);

  const performanceCalendarDays = useMemo(() => getCalendarDays(selectedMonthKey), [selectedMonthKey]);
  const performanceCalendarOffset = performanceCalendarDays[0]?.getDay() ?? 0;
  const forecastCalendarDays = useMemo(() => getCalendarDays(forecastMonthKey), [forecastMonthKey]);
  const forecastCalendarOffset = forecastCalendarDays[0]?.getDay() ?? 0;
  const chatHistoryByDay = useMemo(() => {
    return pruneChatHistory(chatMessages, today).reduce<Record<string, ChatMessage[]>>((acc, message) => {
      const key = message.createdAt.slice(0, 10);
      acc[key] = [...(acc[key] ?? []), message];
      return acc;
    }, {});
  }, [chatMessages, today]);

  const handleMonthStep = (direction: -1 | 1) => {
    const next = addMonths(getMonthStart(selectedMonthKey), direction);
    setSelectedMonthKey(formatMonthInput(next));
  };

  const handleForecastMonthStep = (direction: -1 | 1) => {
    const next = addMonths(getMonthStart(forecastMonthKey), direction);
    setForecastMonthKey(formatMonthInput(next));
  };

  const buildAssistantReply = (userPrompt: string) => {
    const loweredPrompt = userPrompt.toLowerCase();

    if (loweredPrompt.includes('risk')) {
      const firstRisk = highRiskRows[0];
      return firstRisk
        ? `The biggest risk date in ${selectedMonthLabel} is ${formatShortDate(firstRisk.date)} with ${firstRisk.shrinkagePct}% shrinkage and ${firstRisk.pendingLeaves} pending request(s).`
        : `There are no current high-risk dates in ${selectedMonthLabel} for ${myDept?.name ?? 'this department'}.`;
    }

    if (loweredPrompt.includes('week off') || loweredPrompt.includes('swap')) {
      return weekoffOpportunity
        ? `${weekoffOpportunity.agentName} is the cleanest week-off movement candidate right now. Review ${formatShortDate(weekoffOpportunity.riskDate)} to ${formatShortDate(weekoffOpportunity.targetDate)} in the Team Schedule planner.`
        : 'No low-impact week-off movement candidate is available right now, so keep using swaps and approval throttling on the high-risk dates.';
    }

    return `For ${selectedMonthLabel}, the team is tracking ${shrinkageSummary.overallShrinkagePct}% shrinkage with ${highRiskRows.length} high-risk day(s). Review the calendar section for day-level forecast volume and guide coverage before approving more leave.`;
  };

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `chat-user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setChatMessages(previous => pruneChatHistory([...previous, userMessage], today));
    setChatInput('');
    setIsBotTyping(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `chat-assistant-${Date.now() + 1}`,
        sender: 'assistant',
        text: buildAssistantReply(trimmed),
        createdAt: new Date().toISOString(),
      };

      setChatMessages(previous => pruneChatHistory([...previous, assistantMessage], today));
      setIsBotTyping(false);
    }, CHAT_REPLY_DELAY_MS);
  };

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Supervisor Analytics"
        title="Performance"
        highlight="Analytics"
        description={`Department-level analytics for ${myDept?.name ?? 'your department'} with month, date-range, and forecast coverage views.`}
        action={(
          <button
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
          >
            <Bot size={15} /> Chat bot
          </button>
        )}
      />

      <div className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold font-heading">Calendar Filters</div>
            <div className="text-[11px] text-muted-foreground">
              Choose the active month here, then decide whether the page should show a single month, a 3-month window, a 6-month window, or a custom date range.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMonthStep(-1)}
              className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <input
              type="month"
              value={selectedMonthKey}
              onChange={event => setSelectedMonthKey(event.target.value)}
              className="glass-input w-[180px] text-sm"
            />
            <button
              onClick={() => handleMonthStep(1)}
              className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Range Window</label>
            <select
              value={rangePreset}
              onChange={event => setRangePreset(event.target.value === 'custom' ? 'custom' : Number(event.target.value) as RangePreset)}
              className="glass-input text-sm"
            >
              <option value={1}>1 Month</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={event => setDateFrom(event.target.value)}
              disabled={rangePreset !== 'custom'}
              className="glass-input text-sm disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={event => setDateTo(event.target.value)}
              disabled={rangePreset !== 'custom'}
              className="glass-input text-sm disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Months Included</label>
            <div className="flex min-h-[42px] flex-wrap gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
              {selectedRangeMonths.map(month => (
                <span key={month.key} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold">
                  {month.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        {...staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"
      >
        <motion.div variants={staggerItem}>
          <KpiCard label="Forecast Accuracy" value="94.3%" icon={<Target size={18} />} accent="success" subtitle="Department forecast model health" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard
            label="Shrinkage %"
            value={`${shrinkageSummary.overallShrinkagePct}%`}
            icon={<Gauge size={18} />}
            accent={shrinkageSummary.overallShrinkagePct > rules.maxDailyPct ? 'warning' : 'info'}
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
            value={highRiskRows.length}
            icon={<AlertTriangle size={18} />}
            accent="warning"
            subtitle={`${selectedMonthLabel} is the current default month`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <KpiCard
            label="Planned Leaves"
            value={plannedLeaveCount}
            icon={<TrendingUp size={18} />}
            accent="primary"
            subtitle={`${unplannedLeaveCount} unplanned leave day(s) in the same month`}
          />
        </motion.div>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold font-heading">Shrinkage % Forecast</h3>
              <p className="text-[10px] text-muted-foreground">
                Day-wise shrinkage outlook for the current team in {forecastMonthLabel}. Check {forecastNextMonthLabel} next for the forecasted shrinkage calculation for the entire team.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              <button
                onClick={() => handleForecastMonthStep(-1)}
                className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                aria-label="Previous month in shrinkage forecast"
              >
                <ChevronLeft size={13} />
              </button>
              <input
                type="month"
                value={forecastMonthKey}
                onChange={event => setForecastMonthKey(event.target.value)}
                className="glass-input w-[150px] text-sm"
              />
              <button
                onClick={() => handleForecastMonthStep(1)}
                className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                aria-label="Next month in shrinkage forecast"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={`forecast-day-${day}`} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: forecastCalendarOffset }).map((_, index) => (
              <div key={`forecast-empty-${index}`} className="min-h-[100px] rounded-lg bg-muted/10" />
            ))}

            {forecastCalendarDays.map(day => {
              const dayKey = toDateStr(day);
              const item = dailyMetricsByDate[dayKey];
              const isToday = dayKey === todayKey;
              const isPreviousDay = dayKey === previousDay;
              const dayCardClass = isToday
                ? 'border-red-500 bg-background/95 text-foreground shadow-sm ring-1 ring-red-100'
                : item?.isHighRisk
                  ? 'border-amber-500 bg-background/95 text-foreground shadow-sm'
                  : isPreviousDay
                    ? 'border-sky-500 bg-background/95 text-foreground shadow-sm'
                    : 'border-border bg-background/95 text-foreground shadow-sm';
              const subtleTextClass = 'font-medium text-muted-foreground';
              const metricCardClass = 'border-border bg-muted/20 text-foreground';

              return (
                <div
                  key={`forecast-mini-${dayKey}`}
                  className={`min-h-[138px] rounded-lg border px-2 py-2 ${dayCardClass}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-[11px] font-bold">{day.getDate()}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                      isToday
                        ? 'border border-red-200 bg-red-50 text-red-700'
                        : item?.isHighRisk
                          ? 'border border-amber-200 bg-amber-50 text-amber-700'
                          : isPreviousDay
                            ? 'border border-sky-200 bg-sky-50 text-sky-700'
                            : 'border border-border bg-muted/20 text-muted-foreground'
                    }`}>
                      {isToday ? 'Today' : item?.isHighRisk ? 'Risk' : isPreviousDay ? 'Previous day' : day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                  {item ? (
                    <div className="mt-2 space-y-1 text-[8px] leading-tight">
                      <div className={`rounded-md border px-1.5 py-1 ${metricCardClass}`}>
                        <div className={subtleTextClass}>Forecasted Shrinkage Percentage</div>
                        <div className="mt-0.5 text-[10px] font-black">{item.forecastedShrinkagePct}%</div>
                      </div>
                      <div className={subtleTextClass}>Planned Leaves {item.plannedLeaves}</div>
                      <div className={subtleTextClass}>Unplanned Leaves {item.unplannedLeaves}</div>
                      <div className={subtleTextClass}>Week-Off Swap {item.weekoffSwapCount}</div>
                      <div className={subtleTextClass}>Week-Off Move {item.weekoffMoveCount}</div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[9px] text-muted-foreground/50">No data</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-700" /> Today</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Previous day</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> High risk</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3">
            <h3 className="text-sm font-bold font-heading">Planned vs Actual Attendance Trend</h3>
            <p className="text-[10px] text-muted-foreground">
              Month-wise attendance view for the selected date range, including variance number and variance percentage.
            </p>
          </div>

          <div className="space-y-2.5">
            {monthlyAttendanceTrend.map(item => (
              <div key={`attendance-${item.monthKey}`} className="rounded-xl border border-border bg-background/80 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Planned: {item.planned} • Actual: {item.actual}
                    </div>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                    item.variance < 0
                      ? 'border-warning/20 bg-warning/10 text-warning'
                      : 'border-success/20 bg-success/10 text-success'
                  }`}>
                    Variance {formatVariance(item.variance)}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Variance Number</div>
                    <div className="mt-1 font-semibold">{formatVariance(item.variance)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Variance Percentage</div>
                    <div className="mt-1 font-semibold">{formatVariance(item.variancePct)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold font-heading">
              <AlertTriangle size={14} className="text-warning" /> High Risk Dates
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Daily risk details update from the month and date filters above, including shrinkage, leaves taken, pending requests, and forecasted shrinkage.
            </p>
          </div>

          <div className="scrollbar-hidden max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
            {highRiskRows.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                No high-risk dates were detected for {selectedMonthLabel}.
              </div>
            ) : highRiskRows.map(item => (
              <div key={`risk-${item.date}`} className="rounded-xl border border-border bg-muted/20 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{formatDate(item.date)}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Shrinkage hit {item.shrinkagePct}% • Forecasted shrinkage {item.forecastedShrinkagePct}%
                    </div>
                  </div>
                  <span className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[10px] font-bold text-destructive">
                    High Risk
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs md:grid-cols-4">
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Leaves Taken</div>
                    <div className="mt-1 font-semibold">{item.approvedLeaves}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Pending Requests</div>
                    <div className="mt-1 font-semibold">{item.pendingLeaves}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Scheduled Guides</div>
                    <div className="mt-1 font-semibold">{item.scheduledGuides}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/80 p-3">
                    <div className="text-muted-foreground">Forecast Volume</div>
                    <div className="mt-1 font-semibold">{item.forecastVolume}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold font-heading">
              <Users size={14} className="text-info" /> Team Risk Analysis
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Each guide shows approved leaves in {selectedMonthLabel}, split by planned and unplanned leave with total monthly leave percentage.
            </p>
          </div>

          <div className="scrollbar-hidden max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
            {teamRiskRows.map(item => (
              <div key={item.id} className="rounded-xl border border-border bg-muted/20 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {item.approved} approved • planned {item.planned} • unplanned {item.unplanned} • total percentage {item.leavePct}%
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                    item.riskLabel === 'High'
                      ? 'border-destructive/20 bg-destructive/10 text-destructive'
                      : item.riskLabel === 'Moderate'
                        ? 'border-warning/20 bg-warning/10 text-warning'
                        : 'border-success/20 bg-success/10 text-success'
                  }`}>
                    {item.riskLabel}
                  </span>
                </div>
                <div className="mt-3">
                  <Progress value={Math.min(100, item.leavePct * 4)} className="h-2.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold font-heading">Performance Analytics</h3>
            <p className="text-[10px] text-muted-foreground">
              Calendar-wise daily view of shrinkage percentage, forecast volume, scheduled guides, and required guides. The current day is highlighted, the previous day is softly marked, and high-risk dates are highlighted stronger.
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
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1.5">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: performanceCalendarOffset }).map((_, index) => (
            <div key={`calendar-empty-${index}`} className="min-h-[108px] rounded-xl bg-muted/10" />
          ))}

          {performanceCalendarDays.map(day => {
            const dayKey = toDateStr(day);
            const item = dailyMetricsByDate[dayKey];
            const isToday = dayKey === todayKey;
            const isPreviousDay = dayKey === previousDay;
            const performanceCardClass = isToday
              ? 'border-red-500 bg-background/95 text-foreground shadow-sm ring-1 ring-red-100'
              : item?.isHighRisk
                ? 'border-amber-500 bg-background/95 text-foreground shadow-sm'
                : isPreviousDay
                  ? 'border-sky-500 bg-background/95 text-foreground shadow-sm'
                  : 'border-border bg-background/95 text-foreground shadow-sm';
            const performanceMetricClass = 'border-border bg-muted/20 text-foreground';

            return (
              <div
                key={dayKey}
                className={`min-h-[108px] rounded-xl border p-2 ${performanceCardClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold">{day.getDate()}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    isToday
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : item?.isHighRisk
                        ? 'border border-amber-200 bg-amber-50 text-amber-700'
                        : isPreviousDay
                          ? 'border border-sky-200 bg-sky-50 text-sky-700'
                          : 'border border-border bg-muted/20 text-muted-foreground'
                  }`}>
                    {isToday ? 'Today' : item?.isHighRisk ? 'Risk' : isPreviousDay ? 'Previous day' : day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>

                {item ? (
                  <div className="mt-2 space-y-1 text-[9px]">
                    <div className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}>
                      Shrinkage <span className="font-semibold">{item.shrinkagePct}%</span>
                    </div>
                    <div className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}>
                      Forecast <span className="font-semibold">{item.forecastVolume}</span>
                    </div>
                    <div className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}>
                      Scheduled <span className="font-semibold">{item.scheduledGuides}</span>
                    </div>
                    <div className={`rounded-lg border px-2 py-1 ${performanceMetricClass}`}>
                      Required <span className="font-semibold">{item.requiredGuides}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-[10px] text-muted-foreground/50">No team data</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold font-heading">
          <Target size={14} className="text-primary" /> Recommendation Card
        </h3>
        <div className="space-y-2.5">
          {recommendations.map(item => (
            <div key={item.key} className="rounded-xl border border-border bg-muted/20 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      item.severity === 'high'
                        ? 'bg-destructive'
                        : item.severity === 'medium'
                          ? 'bg-warning'
                          : 'bg-info'
                    }`} />
                    <div className="text-sm font-semibold">{item.title}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{item.description}</div>
                </div>
                {item.key === 'weekoff-move' || item.key === 'weekoff-swap' ? (
                  <Link
                    to="/supervisor/schedule"
                    className="inline-flex items-center gap-2 rounded-xl border border-info/20 bg-info/10 px-4 py-2 text-xs font-bold text-info transition-colors hover:bg-info/15"
                  >
                    <Calendar size={12} /> Review Team Schedule
                  </Link>
                ) : item.key === 'forecast-risk' ? (
                  <Link
                    to="/supervisor/approvals?type=Forecast"
                    className="inline-flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-4 py-2 text-xs font-bold text-warning transition-colors hover:bg-warning/15"
                  >
                    <AlertTriangle size={12} /> Review Forecast Alerts
                  </Link>
                ) : (
                  <button className="inline-flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-2 text-xs font-bold text-success transition-colors hover:bg-success/15">
                    <CheckCircle size={12} /> Action Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                      <Bot size={18} className="text-primary" /> Analytics Chat bot
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Last 5 days of chat history are kept in this view. Dummy history is preloaded for now.
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
                      <Clock size={14} className="text-info" /> Recent Chat History
                    </div>
                    <div className="scrollbar-hidden min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {Object.entries(chatHistoryByDay)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([day, messages]) => (
                          <div key={day} className="rounded-xl border border-border bg-background/80 p-4">
                            <div className="text-xs font-semibold">{formatDate(day)}</div>
                            <div className="mt-2 space-y-2">
                              {messages.slice(-3).map(message => (
                                <div key={message.id} className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                                  <span className="font-semibold text-foreground">{message.sender === 'assistant' ? 'Bot' : 'You'}:</span> {message.text}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col overflow-hidden">
                    <div className="scrollbar-hidden min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                      {pruneChatHistory(chatMessages, today).map(message => (
                        <div
                          key={message.id}
                          className={`max-w-3xl rounded-2xl border px-4 py-3 text-sm ${
                            message.sender === 'assistant'
                              ? 'border-border bg-muted/20 text-foreground'
                              : 'ml-auto border-primary/20 bg-primary/10 text-foreground'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {message.sender === 'assistant' ? <MessageSquare size={11} /> : <Users size={11} />}
                            {message.sender === 'assistant' ? 'Analytics Bot' : 'You'}
                          </div>
                          <div>{message.text}</div>
                        </div>
                      ))}
                      {isBotTyping ? (
                        <div className="max-w-3xl rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground">
                          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            <MessageSquare size={11} /> Analytics Bot
                          </div>
                          <div className="text-muted-foreground">Reviewing the latest supervisor analytics…</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="border-t border-border px-6 py-4">
                      <div className="mb-2 text-xs text-muted-foreground">
                        Ask about high-risk dates, team shrinkage, production gaps, or week-off movement recommendations.
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <textarea
                          value={chatInput}
                          onChange={event => setChatInput(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey) {
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
