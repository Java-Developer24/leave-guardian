import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/kpis/KpiCard';
import { calcDailyShrinkage } from '@/core/utils/shrinkage';
import { toDateStr, formatDate, getMonthKey, formatMonthYear } from '@/core/utils/dates';
import {
  Building2,
  Users,
  UserRound,
  BarChart3,
  Gauge,
  AlertTriangle,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Target,
  TrendingUp,
  X,
  Calendar,
} from 'lucide-react';

interface ForecastAlertDetail {
  id: string;
  date: string;
  departmentId: string;
  forecastVolume: number;
  requiredGuides: number;
  scheduledGuides: number;
  availableGuides: number;
  shrinkageBefore: number;
  shrinkageAfter: number;
  status: string;
}

interface DailyMetric {
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

interface AttendanceTrendMetric {
  monthKey: string;
  label: string;
  planned: number;
  actual: number;
  variance: number;
  variancePct: number;
  isReference?: boolean;
}

// Utility functions matching SupervisorAnalytics
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

function formatMonthInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKeysBetween(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const months: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    months.push(formatMonthInput(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function getCalendarDays(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const days: Date[] = [];
  const cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function formatVariance(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

export default function ManagerAnalytics() {
  const { departments, users, leaves, schedule, forecastAlerts, rules } = useAppStore();
  const today = useMemo(() => new Date(), []);
  const todayStr = toDateStr(today);
  const currentMonthKey = todayStr.slice(0, 7);

  // State for filters
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('all');
  const [analyticsTab, setAnalyticsTab] = useState<'analytics' | 'departments'>('analytics');
  const [selectedForecastAlert, setSelectedForecastAlert] = useState<ForecastAlertDetail | null>(null);
  const [enterpriseDateFrom, setEnterpriseDateFrom] = useState(toDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [enterpriseDateTo, setEnterpriseDateTo] = useState(toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0)));
  const [enterpriseDeptId, setEnterpriseDeptId] = useState('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
  const [performanceMonthKey, setPerformanceMonthKey] = useState(currentMonthKey);
  const [teamRiskFilterMode, setTeamRiskFilterMode] = useState<'month' | 'monthRange' | 'dateRange'>('month');
  const [teamRiskMonthKey, setTeamRiskMonthKey] = useState(currentMonthKey);
  const [teamRiskMonthFrom, setTeamRiskMonthFrom] = useState(currentMonthKey);
  const [teamRiskMonthTo, setTeamRiskMonthTo] = useState(currentMonthKey);
  const [teamRiskDateFrom, setTeamRiskDateFrom] = useState(toDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [teamRiskDateTo, setTeamRiskDateTo] = useState(toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0)));

  // Month navigation helpers
  const handleMonthStep = (direction: number) => {
    const [year, month] = selectedMonthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonthKey(getMonthKey(date));
  };

  const handleTeamRiskMonthStep = (direction: number) => {
    const [year, month] = teamRiskMonthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setTeamRiskMonthKey(getMonthKey(date));
  };

  // Get supervisors based on selected department
  const filteredSupervisors = useMemo(() => {
    if (selectedDepartmentId === 'all') {
      return users.filter(u => u.role === 'supervisor').sort((a, b) => a.name.localeCompare(b.name));
    }
    return users.filter(u => u.role === 'supervisor' && u.departmentId === selectedDepartmentId).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedDepartmentId, users]);

  // Update selected supervisor if it's not in the filtered list
  useMemo(() => {
    if (selectedSupervisorId !== 'all' && !filteredSupervisors.find(s => s.id === selectedSupervisorId)) {
      setSelectedSupervisorId('all');
    }
  }, [filteredSupervisors, selectedSupervisorId]);

  // Get supervisor's department for analytics
  const analyticsDeptId = useMemo(() => {
    if (selectedSupervisorId === 'all') {
      return selectedDepartmentId;
    }
    const supervisor = users.find(u => u.id === selectedSupervisorId);
    return supervisor?.departmentId ?? selectedDepartmentId;
  }, [selectedSupervisorId, selectedDepartmentId, users]);

  const analyticsDept = departments.find(d => d.id === analyticsDeptId);

  // Department rows for Enterprise Analytics
  const departmentRows = useMemo(() => {
    const deptList = enterpriseDeptId === 'all' ? departments : departments.filter(d => d.id === enterpriseDeptId);

    return deptList.map(dept => {
      const deptGuides = users.filter(user => user.role === 'agent' && user.departmentId === dept.id);
      const deptSupervisors = users.filter(user => user.role === 'supervisor' && user.departmentId === dept.id);
      const deptLeaves = leaves.filter(leave => leave.departmentId === dept.id);
      const pending = deptLeaves.filter(leave => ['PendingSupervisor', 'PendingPeer'].includes(leave.status)).length;
      const approved = deptLeaves.filter(leave => leave.status === 'Approved').length;
      const shrinkage = calcDailyShrinkage(todayStr, deptLeaves, schedule);
      const alerts = forecastAlerts.filter(alert => alert.departmentId === dept.id && alert.status === 'Open').length;

      return {
        id: dept.id,
        name: dept.name,
        guides: deptGuides.length,
        supervisors: deptSupervisors.length,
        approved,
        pending,
        shrinkage: Number(shrinkage.toFixed(1)),
        alerts,
      };
    }).sort((a, b) => b.shrinkage - a.shrinkage);
  }, [departments, users, leaves, todayStr, schedule, forecastAlerts, enterpriseDeptId]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const deptList = selectedDepartmentId === 'all' ? departments : departments.filter(d => d.id === selectedDepartmentId);
    const deptGuides = users.filter(u => u.role === 'agent' && deptList.some(d => d.id === u.departmentId));
    const deptSupervisors = deptList.flatMap(d => users.filter(u => u.role === 'supervisor' && u.departmentId === d.id));
    const deptLeaves = leaves.filter(l => deptList.some(d => d.id === l.departmentId));
    const deptAlerts = forecastAlerts.filter(a => deptList.some(d => d.id === a.departmentId) && a.status === 'Open');

    return {
      departments: deptList.length,
      supervisors: deptSupervisors.length,
      guides: deptGuides.length,
      leaves: deptLeaves.filter(l => l.status === 'Approved').length,
      alerts: deptAlerts.length,
    };
  }, [selectedDepartmentId, departments, users, leaves, forecastAlerts]);

  const previousDay = useMemo(() => {
    const value = new Date(today);
    value.setDate(value.getDate() - 1);
    return toDateStr(value);
  }, [today]);

  // Get supervisor's guides for analytics
  const supervisorGuides = useMemo(() => {
    const deptList = selectedDepartmentId === 'all' ? departments : departments.filter(d => d.id === selectedDepartmentId);
    
    if (selectedSupervisorId === 'all') {
      return users.filter(u => u.role === 'agent' && deptList.some(d => d.id === u.departmentId));
    }
    
    // Get agents in the supervisor's department
    const supervisor = users.find(u => u.id === selectedSupervisorId);
    if (!supervisor?.departmentId) return [];
    return users.filter(u => u.role === 'agent' && u.departmentId === supervisor.departmentId);
  }, [selectedSupervisorId, selectedDepartmentId, departments, users]);

  // Get supervisor's leaves for analytics
  const supervisorLeaves = useMemo(() => {
    const deptList = selectedDepartmentId === 'all' ? departments : departments.filter(d => d.id === selectedDepartmentId);
    
    if (selectedSupervisorId === 'all') {
      return leaves.filter(l => deptList.some(d => d.id === l.departmentId) && supervisorGuides.some(g => g.id === l.requesterId));
    }
    return leaves.filter(l => supervisorGuides.some(g => g.id === l.requesterId));
  }, [selectedSupervisorId, selectedDepartmentId, departments, leaves, supervisorGuides]);

  // Build performance calendar for selected month
  const performanceCalendarDays = useMemo(() => getCalendarDays(performanceMonthKey), [performanceMonthKey]);
  const performanceCalendarOffset = useMemo(() => new Date(performanceCalendarDays[0]).getDay(), [performanceCalendarDays]);

  // Build daily metrics for calendar
  const dailyMetricsByDate = useMemo(() => {
    const metrics: Record<string, DailyMetric> = {};
    const maxShrinkagePct = rules.maxDailyPct || 10;

    performanceCalendarDays.forEach(day => {
      const dayStr = toDateStr(day);
      const dayScheduled = schedule.filter(s => s.date === dayStr && supervisorGuides.some(g => g.id === s.userId)).length;
      
      // Calculate leaves breakdown
      const dayApprovedLeaves = supervisorLeaves.filter(
        l => l.date === dayStr && l.status === 'Approved' && supervisorGuides.some(g => g.id === l.requesterId)
      ).length;
      
      const dayPendingLeaves = supervisorLeaves.filter(
        l => l.date === dayStr && l.status === 'PendingSupervisor' && supervisorGuides.some(g => g.id === l.requesterId)
      ).length;
      
      const dayPlannedLeaves = supervisorLeaves.filter(
        l => l.date === dayStr && l.status === 'Approved' && l.type === 'Planned' && supervisorGuides.some(g => g.id === l.requesterId)
      ).length;
      
      const dayUnplannedLeaves = supervisorLeaves.filter(
        l => l.date === dayStr && l.status === 'Approved' && l.type === 'Unplanned' && supervisorGuides.some(g => g.id === l.requesterId)
      ).length;
      
      const activeLeaves = dayApprovedLeaves;
      const shrinkagePct = dayScheduled > 0 ? Number(((activeLeaves / dayScheduled) * 100).toFixed(1)) : 0;
      const plannedShrinkagePct = dayScheduled > 0 ? Number(((dayPlannedLeaves / dayScheduled) * 100).toFixed(1)) : 0;
      const unplannedShrinkagePct = dayScheduled > 0 ? Number(((dayUnplannedLeaves / dayScheduled) * 100).toFixed(1)) : 0;
      
      // Calculate forecast metrics
      const requiredGuides = Math.max(1, dayScheduled - Math.floor(dayScheduled * 0.1));
      const availableGuides = dayScheduled - activeLeaves;
      const coverageGap = Math.max(0, requiredGuides - availableGuides);
      const forecastVolume = Math.floor(Math.random() * 50) + 20;
      const forecastedShrinkagePct = dayScheduled > 0 ? Number((((activeLeaves + coverageGap) / dayScheduled) * 100).toFixed(1)) : shrinkagePct;
      
      const isHighRisk = availableGuides < requiredGuides || shrinkagePct >= maxShrinkagePct;
      
      metrics[dayStr] = {
        date: dayStr,
        scheduledGuides: dayScheduled,
        requiredGuides,
        forecastVolume,
        approvedLeaves: dayApprovedLeaves,
        pendingLeaves: dayPendingLeaves,
        activeLeaves,
        plannedLeaves: dayPlannedLeaves,
        unplannedLeaves: dayUnplannedLeaves,
        plannedShrinkagePct,
        unplannedShrinkagePct,
        shrinkagePct,
        availableGuides,
        forecastedShrinkagePct,
        weekoffSwapCount: 0,
        weekoffMoveCount: 0,
        isHighRisk,
      };
    });

    return metrics;
  }, [performanceCalendarDays, supervisorGuides, supervisorLeaves, schedule, rules]);

  // Calculate summary metrics for Analytics tab
  const summaryAnalyticsMetrics = useMemo(() => {
    const todayMetric = dailyMetricsByDate[todayStr];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthStr = toDateStr(monthStart);
    const monthEndStr = toDateStr(monthEnd);

    const monthLeaves = supervisorLeaves.filter(l => l.date >= monthStr && l.date <= monthEndStr);
    const high_risk_days = Object.values(dailyMetricsByDate).filter(m => m.isHighRisk).length;

    return {
      shrinkage: todayMetric?.shrinkagePct ?? 0,
      highRiskDays: high_risk_days,
      approved: monthLeaves.filter(l => l.status === 'Approved').length,
      pending: monthLeaves.filter(l => ['PendingSupervisor', 'PendingPeer', 'Submitted'].includes(l.status)).length,
      weekoffSwaps: monthLeaves.filter(l => l.type === 'Swap' && ['Approved', 'PendingAdmin'].includes(l.status)).length,
      supervisorGuides: supervisorGuides.length,
    };
  }, [dailyMetricsByDate, supervisorLeaves, supervisorGuides, today, todayStr]);

  const handlePerformanceMonthStep = (direction: number) => {
    const [year, month] = performanceMonthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setPerformanceMonthKey(getMonthKey(date));
  };

  const performanceMonthLabel = useMemo(() => {
    const [year, month] = performanceMonthKey.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [performanceMonthKey]);

  // High Risk Dates
  const highRiskDates = useMemo(() => {
    return Object.values(dailyMetricsByDate)
      .filter(m => m.isHighRisk)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyMetricsByDate]);

  // Team Risk Analysis - calculate based on filter mode
  const teamRiskDates = useMemo(() => {
    const getDateRange = (): [string, string] => {
      if (teamRiskFilterMode === 'month') {
        const [year, month] = teamRiskMonthKey.split('-').map(Number);
        const start = toDateStr(new Date(year, month - 1, 1));
        const end = toDateStr(new Date(year, month, 0));
        return [start, end];
      } else if (teamRiskFilterMode === 'monthRange') {
        const [y1, m1] = teamRiskMonthFrom.split('-').map(Number);
        const [y2, m2] = teamRiskMonthTo.split('-').map(Number);
        const start = toDateStr(new Date(y1, m1 - 1, 1));
        const end = toDateStr(new Date(y2, m2, 0));
        return [start, end];
      } else {
        return [teamRiskDateFrom, teamRiskDateTo];
      }
    };

    const [dateFrom, dateTo] = getDateRange();
    const datesInRange = [];
    const cursor = new Date(`${dateFrom}T00:00:00`);
    const endDate = new Date(`${dateTo}T00:00:00`);

    while (cursor <= endDate) {
      datesInRange.push(toDateStr(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return datesInRange.map(date => {
      const metric = dailyMetricsByDate[date];
      return {
        date,
        shrinkage: metric?.shrinkagePct ?? 0,
        scheduled: metric?.scheduledGuides ?? 0,
        isHighRisk: metric?.isHighRisk ?? false,
      };
    });
  }, [teamRiskFilterMode, teamRiskMonthKey, teamRiskMonthFrom, teamRiskMonthTo, teamRiskDateFrom, teamRiskDateTo, dailyMetricsByDate]);

  const teamRiskWindow = useMemo(() => {
    const getLabel = (): string => {
      if (teamRiskFilterMode === 'month') {
        const [year, month] = teamRiskMonthKey.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (teamRiskFilterMode === 'monthRange') {
        const from = new Date(teamRiskMonthFrom.split('-').map(Number)[0], teamRiskMonthFrom.split('-').map(Number)[1] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const to = new Date(teamRiskMonthTo.split('-').map(Number)[0], teamRiskMonthTo.split('-').map(Number)[1] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return `${from} - ${to}`;
      } else {
        const from = new Date(teamRiskDateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const to = new Date(teamRiskDateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${from} - ${to}`;
      }
    };
    return {
      label: getLabel(),
      helperLabel: `${teamRiskDates.length} days`,
    };
  }, [teamRiskFilterMode, teamRiskMonthKey, teamRiskMonthFrom, teamRiskMonthTo, teamRiskDateFrom, teamRiskDateTo, teamRiskDates]);

  // Shrinkage Forecast - Month-wise actual vs forecast
  const shrinkageForecastData = useMemo(() => {
    // For enterprise/manager view, calculate across all departments
    const lastSixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      lastSixMonths.push(getMonthKey(date));
    }

    return lastSixMonths.map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthStart = toDateStr(new Date(year, month - 1, 1));
      const monthEnd = toDateStr(new Date(year, month, 0));
      
      // Get all leaves across enterprise for this month
      const monthLeaves = leaves.filter(l => l.date >= monthStart && l.date <= monthEnd && l.status === 'Approved');
      
      // Get all schedule entries for this month
      const monthSchedule = schedule.filter(s => s.date >= monthStart && s.date <= monthEnd && !s.weekOff);
      
      // Calculate enterprise-wide shrinkage percentage
      const totalScheduled = monthSchedule.length;
      const totalLeaves = monthLeaves.reduce((sum, l) => sum + l.days, 0);
      const avgDailyShrinkage = totalScheduled > 0 ? (totalLeaves / totalScheduled) * 100 : 0;
      const forecastedShrinkage = avgDailyShrinkage * 1.1; // Forecast inflation

      return {
        monthKey,
        month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' }),
        actual: round1(avgDailyShrinkage),
        forecast: round1(forecastedShrinkage),
      };
    });
  }, [leaves, schedule, today]);

  // Monthly attendance trend data (enterprise-wide)
  const monthlyAttendanceTrend = useMemo<AttendanceTrendMetric[]>(() => {
    // Generate range month keys - for manager analytics, we'll show the current month and some past months
    const endDate = getMonthEnd(selectedMonthKey);
    const startDate = addMonths(getMonthStart(selectedMonthKey), -2);
    const rangeMonthKeys = getMonthKeysBetween(toDateStr(startDate), toDateStr(endDate));

    return rangeMonthKeys.map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthStartStr = toDateStr(new Date(year, month - 1, 1));
      const monthEndStr = toDateStr(new Date(year, month, 0));

      // Planned attendance based on scheduled guides (enterprise-wide)
      const monthPlanned = schedule.filter(
        row => row.date.startsWith(monthKey) && row.date >= monthStartStr && row.date <= monthEndStr && !row.weekOff,
      ).length;

      // Approved leaves for the month (enterprise-wide)
      const monthApprovedLeaves = leaves
        .filter(leave => leave.date.startsWith(monthKey) && leave.date >= monthStartStr && leave.date <= monthEndStr && leave.status === 'Approved')
        .reduce((total, leave) => total + leave.days, 0);

      // Actual attendance = planned - approved leaves
      const actual = Math.max(0, monthPlanned - monthApprovedLeaves);
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
  }, [selectedMonthKey, schedule, leaves]);

  // Display attendance trend with reference data (matches SupervisorAnalytics exactly)
  const displayMonthlyAttendanceTrend = useMemo<AttendanceTrendMetric[]>(() => {
    const minimumCards = 1;
    const displayCount = Math.max(minimumCards, monthlyAttendanceTrend.length);
    const trendByMonth = new Map(monthlyAttendanceTrend.map(item => [item.monthKey, item]));
    const anchorTrend = monthlyAttendanceTrend.find(item => item.planned > 0 || item.actual > 0) ?? {
      monthKey: selectedMonthKey,
      label: formatMonthYear(selectedMonthKey),
      planned: Math.max(48, supervisorGuides.length * 20),
      actual: Math.max(42, (supervisorGuides.length * 20) - 4),
      variance: -4,
      variancePct: -7.5,
    };

    return Array.from({ length: displayCount }, (_, index) => {
      const monthDate = addMonths(getMonthStart(selectedMonthKey), -((displayCount - 1) - index));
      const monthKey = formatMonthInput(monthDate);
      const existing = trendByMonth.get(monthKey);

      if (existing && (existing.planned > 0 || existing.actual > 0)) {
        return existing;
      }

      const recencyOffset = displayCount - 1 - index;
      const planned = Math.max(44, anchorTrend.planned - (recencyOffset * 4) + (index % 2 === 0 ? 2 : -1));
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
  }, [monthlyAttendanceTrend, selectedMonthKey, supervisorGuides.length]);

  const attendanceTrendMax = useMemo(
    () => Math.max(1, ...displayMonthlyAttendanceTrend.flatMap(item => [item.planned, item.actual])),
    [displayMonthlyAttendanceTrend],
  );
 const initialMonthKey = getMonthKey(today);
  const [forecastMonthKey, setForecastMonthKey] = useState(initialMonthKey);
    const forecastMonthLabel = formatMonthYear(forecastMonthKey);
    const forecastNextMonthLabel = formatMonthYear(addMonths(getMonthStart(forecastMonthKey), 1));
    const handleForecastMonthStep = (direction: -1 | 1) => {
    const next = addMonths(getMonthStart(forecastMonthKey), direction);
    setForecastMonthKey(formatMonthInput(next));
  };

    const forecastCalendarDays = useMemo(() => getCalendarDays(forecastMonthKey), [forecastMonthKey]);
    const forecastCalendarOffset = forecastCalendarDays[0]?.getDay() ?? 0;
 
  const todayKey = toDateStr(today);




  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag="Manager Persona"
        title="Performance"
        highlight="Analytics"
        description={`Department-level analytics with performance monitoring, forecast visibility, and enterprise overview.`}
      />

      {/* View Toggle */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setAnalyticsTab('analytics')}
          className={`rounded-lg px-5 py-2.5 font-semibold text-sm transition-colors ${analyticsTab === 'analytics' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
           Analytics
        </button>
        <button
          onClick={() => setAnalyticsTab('departments')}
          className={`rounded-lg px-5 py-2.5 font-semibold text-sm transition-colors ${analyticsTab === 'departments' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Departments View
        </button>
      </div>

      {/* ANALYTICS VIEW */}
      {analyticsTab === 'analytics' && (
        <div className="space-y-5">
          {/* Calendar Filters Card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold font-heading">Apply Filters</div>
                <div className="text-[11px] text-muted-foreground">
                  Select a supervisor and department to view their performance analytics.
                </div>
              </div>
           
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Department</label>
                <select
                  value={selectedDepartmentId}
                  onChange={event => {
                    setSelectedDepartmentId(event.target.value);
                    setSelectedSupervisorId('all');
                  }}
                  className="glass-input text-sm w-full"
                >
                  <option value="all">All Departments</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Supervisor</label>
                <select
                  value={selectedSupervisorId}
                  onChange={event => setSelectedSupervisorId(event.target.value)}
                  className="glass-input text-sm w-full"
                >
                  <option value="all">All Supervisors</option>
                  {filteredSupervisors.map(supervisor => (
                    <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
                  ))}
                </select>
              </div>
            </div>

             {/* Month Selector */}
            <div className="grid grid-cols-3 items-center justify-between gap-3 mt-4">
              <div>
           <label className="block text-[10px] tracking-section text-center uppercase text-muted-foreground mb-1.5 font-semibold">Month</label>
              <input
                type="month"
                
                value={selectedMonthKey}
                onChange={event => setSelectedMonthKey(event.target.value)}
                className="glass-input text-sm flex-1 text-center "
              />
              </div>
              
               <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Date From</label>
                <input
                  type="date"
                  value={enterpriseDateFrom}
                  onChange={event => setEnterpriseDateFrom(event.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Date To</label>
                <input
                  type="date"
                  value={enterpriseDateTo}
                  onChange={event => setEnterpriseDateTo(event.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>
            </div>

          </div>
          

          {/* KPI Cards */}
          <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <motion.div variants={staggerItem}>
              <KpiCard label="Forecast Accuracy" value="94.3%" icon={<Target size={18} />} accent="success" subtitle="Forecasted shrinkage%" />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label="Shrinkage %"
                value={`${summaryAnalyticsMetrics.shrinkage.toFixed(1)}%`}
                icon={<Gauge size={18} />}
                accent={summaryAnalyticsMetrics.shrinkage > 8 ? 'warning' : 'info'}
                subtitle={`Today's actual shrinkage`}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label="Guides"
                value={summaryAnalyticsMetrics.supervisorGuides}
                icon={<Users size={18} />}
                accent="primary"
                subtitle={`In selected team`}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label="High Risk Days"
                value={`${summaryAnalyticsMetrics.highRiskDays}d`}
                icon={<AlertTriangle size={18} />}
                accent="warning"
                subtitle={`This month`}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label="Total Leaves"
                value={summaryAnalyticsMetrics.approved + summaryAnalyticsMetrics.pending}
                icon={<TrendingUp size={18} />}
                accent="primary"
                subtitle={`PL- ${summaryAnalyticsMetrics.approved} • Pending- ${summaryAnalyticsMetrics.pending}`}
              />
            </motion.div>
          </motion.div>

          {/* Shrinkage % Forecast and Attendance Trend */}
        <div className="mb-5 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(340px,0.58fr)]">
        <div className="self-start rounded-xl border border-border bg-card p-3.5 lg:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold font-heading">Shrinkage % Forecast</h3>
              <p className="text-[9px] leading-5 text-muted-foreground">
                Day-wise shrinkage outlook for the current team in {forecastMonthLabel}. Check {forecastNextMonthLabel} next for the forecasted shrinkage calculation for the entire team.
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
                onChange={event => setForecastMonthKey(event.target.value)}
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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={`forecast-day-${day}`} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: forecastCalendarOffset }).map((_, index) => (
              <div key={`forecast-empty-${index}`} className="min-h-[86px] rounded-lg bg-muted/10" />
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
                  className={`min-h-[104px] rounded-lg border px-1.5 py-1.5 ${dayCardClass}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-[10px] font-bold">{day.getDate()}</div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold ${
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
                    <div className="mt-1.5 space-y-1 text-[7px] leading-tight">
                      <div className={`rounded-md border px-1.5 py-1 ${metricCardClass}`}>
                        <div className={subtleTextClass}>Forecast Shrinkage %</div>
                        <div className="mt-0.5 text-[10px] font-black">{item.forecastedShrinkagePct}%</div>
                      </div>
                      <div className={`rounded-md border px-1.5 py-1 ${metricCardClass}`}>
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className={subtleTextClass}>PL</span>
                            <span className="font-semibold">{item.plannedLeaves}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className={subtleTextClass}>UPL</span>
                            <span className="font-semibold">{item.unplannedLeaves}</span>
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
                    <div className="mt-3 text-[8px] text-muted-foreground/50">No data</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> High risk</span>
               <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-700" />PL-Planned Leave</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" />UPL- Unplanned leaves</span>


          </div>
        </div>

        <div className="self-start rounded-xl border border-border bg-card p-3 ">
          <div className="mb-8">
            <h3 className="text-sm font-bold font-heading">Planned vs Actual Attendance Trend</h3>
            <p className="text-[10px] text-muted-foreground">
              Month-wise attendance view for the selected date range, including variance number and variance percentage.
            </p>
          </div>

          

          <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
            {displayMonthlyAttendanceTrend.map(item => (
              <div key={`attendance-${item.monthKey}`} className="rounded-xl border border-border bg-background/80 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{item.label}</div>
                      {item.isReference ? (
                        <span className="rounded-full border border-info/20 bg-info/10 px-2 py-0.5 text-[9px] font-bold text-info">
                          Reference
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Planned {item.planned} • Actual {item.actual}
                    </div>
                  </div>
                  <div className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    item.variance < 0
                      ? 'border-warning/20 bg-warning/10 text-warning'
                      : 'border-success/20 bg-success/10 text-success'
                  }`}>
                    {formatVariance(item.variance)}
                  </div>
                </div>

                <div className="mt-3 space-y-2.5 text-[11px]">
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Planned</span>
                      <span className="font-semibold">{item.planned}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/25">
                      <div
                        className="h-2 rounded-full bg-primary/75"
                        style={{ width: `${Math.max(16, (item.planned / attendanceTrendMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Actual</span>
                      <span className="font-semibold">{item.actual}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/25">
                      <div
                        className="h-2 rounded-full bg-success/80"
                        style={{ width: `${Math.max(16, (item.actual / attendanceTrendMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                    <div className="text-muted-foreground">Variance Number</div>
                    <div className="mt-1 font-semibold">{formatVariance(item.variance)}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                    <div className="text-muted-foreground">Variance Percentage</div>
                    <div className="mt-1 font-semibold">{formatVariance(item.variancePct)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

         

          {/* Two Column Layout: High Risk Dates + Team Risk Analysis (Exact SupervisorAnalytics match) */}
          <div className="mb-5 grid grid-cols-2 gap-4">
            {/* High Risk Dates Card - Detailed Cards like SupervisorAnalytics */}
            <div className="rounded-xl border border-border bg-card p-3.5 lg:p-4">
              <div className="mb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold font-heading">
                  <AlertTriangle size={14} className="text-warning" /> High Risk Dates
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Daily risk details update from the month and date filters above, including shrinkage, leaves taken, pending requests, and forecasted shrinkage.
                </p>
              </div>

              <div className="scrollbar-hidden max-h-[750px] space-y-2.5 overflow-y-auto pr-1">
                {highRiskDates.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    No high-risk dates were detected for this period.
                  </div>
                ) : highRiskDates.map(item => (
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

            {/* Team Risk Analysis Card - Agent Cards like SupervisorAnalytics */}
            <div className="rounded-xl border border-border bg-card p-3.5 lg:p-4">
              <div className="mb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold font-heading">
                  <Users size={14} className="text-info" /> Team Risk Analysis
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Guide-wise approved leaves breakdown split by planned and unplanned leave for the selected period.
                </p>
              </div>

              <div className="mb-4 rounded-xl border border-border bg-background/80 p-3">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Filters</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Switch this card between a single month, a month range, or a custom date range.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'month', label: 'Month' },
                      { key: 'monthRange', label: 'Month Range' },
                      { key: 'dateRange', label: 'Date Range' },
                    ].map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setTeamRiskFilterMode(option.key as typeof teamRiskFilterMode)}
                        className={`rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ${
                          teamRiskFilterMode === option.key
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {teamRiskFilterMode === 'month' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleTeamRiskMonthStep(-1)}
                      className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                      aria-label="Previous month in team risk analysis"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <input
                      type="month"
                      value={teamRiskMonthKey}
                      onChange={event => setTeamRiskMonthKey(event.target.value)}
                      className="glass-input w-[180px] text-sm"
                    />
                    <button
                      onClick={() => handleTeamRiskMonthStep(1)}
                      className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                      aria-label="Next month in team risk analysis"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : teamRiskFilterMode === 'monthRange' ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">From Month</label>
                      <input
                        type="month"
                        value={teamRiskMonthFrom}
                        onChange={event => setTeamRiskMonthFrom(event.target.value)}
                        className="glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">To Month</label>
                      <input
                        type="month"
                        value={teamRiskMonthTo}
                        onChange={event => setTeamRiskMonthTo(event.target.value)}
                        className="glass-input text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">From Date</label>
                      <input
                        type="date"
                        value={teamRiskDateFrom}
                        onChange={event => setTeamRiskDateFrom(event.target.value)}
                        className="glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">To Date</label>
                      <input
                        type="date"
                        value={teamRiskDateTo}
                        onChange={event => setTeamRiskDateTo(event.target.value)}
                        className="glass-input text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-[11px]">
                  <Calendar size={13} className="text-primary" />
                  <span className="font-semibold text-foreground">{teamRiskWindow.label}</span>
                  <span className="text-muted-foreground">Active window: {teamRiskWindow.helperLabel}</span>
                </div>
              </div>

              <div className="scrollbar-hidden max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                {supervisorGuides.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    No team members are available for the selected window.
                  </div>
                ) : supervisorGuides.map(agent => {
                  const agentLeaves = supervisorLeaves.filter(
                    leave =>
                      leave.requesterId === agent.id &&
                      leave.status === 'Approved' &&
                      leave.date >= (teamRiskFilterMode === 'month' ? toDateStr(getMonthStart(teamRiskMonthKey)) : teamRiskFilterMode === 'monthRange' ? toDateStr(getMonthStart(teamRiskMonthFrom)) : teamRiskDateFrom) &&
                      leave.date <= (teamRiskFilterMode === 'month' ? toDateStr(getMonthEnd(teamRiskMonthKey)) : teamRiskFilterMode === 'monthRange' ? toDateStr(getMonthEnd(teamRiskMonthTo)) : teamRiskDateTo),
                  );
                  const planned = agentLeaves.filter(leave => leave.type === 'Planned').reduce((total, leave) => total + leave.days, 0);
                  const unplanned = agentLeaves.filter(leave => leave.type === 'Unplanned').reduce((total, leave) => total + leave.days, 0);
                  const approved = planned + unplanned;
                  const riskLabel = approved >= 16 ? 'High' : approved >= 10 ? 'Moderate' : 'Low';

                  return (
                    <div key={agent.id} className="rounded-xl border border-border bg-muted/20 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{agent.name}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Leaves: {approved} Approved • Planned {planned} • Unplanned {unplanned}
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                          riskLabel === 'High'
                            ? 'border-destructive/20 bg-destructive/10 text-destructive'
                            : riskLabel === 'Moderate'
                              ? 'border-warning/20 bg-warning/10 text-warning'
                              : 'border-success/20 bg-success/10 text-success'
                        }`}>
                          {riskLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
           {/* Two Column Layout: Calendar + Attendance */}
          <div className="grid grid-cols-1 items-start gap-4 ">
            {/* Performance Analytics Calendar */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold font-heading">Performance Analytics</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Calendar-wise daily view of shrinkage, forecast volume, scheduled and required guides.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePerformanceMonthStep(-1)}
                    className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="min-w-[170px] rounded-xl border border-border bg-muted/20 px-4 py-2 text-center text-sm font-semibold">
                    {performanceMonthLabel}
                  </div>
                  <button
                    onClick={() => handlePerformanceMonthStep(1)}
                    className="rounded-xl border border-border p-2 transition-colors hover:bg-muted/30"
                    aria-label="Next month"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60 mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-1.5">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: performanceCalendarOffset }).map((_, index) => (
                  <div key={`calendar-empty-${index}`} className="min-h-[96px] rounded-xl bg-muted/10" />
                ))}

                {performanceCalendarDays.map(day => {
                  const dayKey = toDateStr(day);
                  const item = dailyMetricsByDate[dayKey];
                  const isToday = dayKey === todayStr;
                  const isPreviousDay = dayKey === previousDay;
                  
                  const cardClass = isToday
                    ? 'border-red-500 bg-background/95 text-foreground shadow-sm ring-1 ring-red-100'
                    : item?.isHighRisk
                      ? 'border-amber-500 bg-background/95 text-foreground shadow-sm'
                      : isPreviousDay
                        ? 'border-sky-500 bg-background/95 text-foreground shadow-sm'
                        : 'border-border bg-background/95 text-foreground shadow-sm';

                  const metricClass = 'border-border bg-muted/20 text-foreground';
                  const badgeClass = isToday
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : item?.isHighRisk
                      ? 'border border-amber-200 bg-amber-50 text-amber-700'
                      : isPreviousDay
                        ? 'border border-sky-200 bg-sky-50 text-sky-700'
                        : 'border border-border bg-muted/20 text-muted-foreground';

                  return (
                    <div
                      key={dayKey}
                      className={`min-h-[96px] rounded-xl border p-2 ${cardClass}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-bold">{day.getDate()}</div>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${badgeClass}`}>
                          {isToday ? 'Today' : item?.isHighRisk ? 'Risk' : isPreviousDay ? 'Prev' : day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>

                      {item ? (
                        <div className="mt-2 space-y-1 text-[9px]">
                          <div className={`rounded-lg border px-2 py-1 ${metricClass}`}>
                            Shrink: <span className="font-semibold">{item.shrinkagePct}%</span>
                          </div>
                          <div className={`rounded-lg border px-2 py-1 ${metricClass}`}>
                            Fcst: <span className="font-semibold">{item.forecastVolume}</span>
                          </div>
                          <div className={`rounded-lg border px-2 py-1 ${metricClass}`}>
                            Req: <span className="font-semibold">{item.requiredGuides}</span>
                          </div>
                          <div className={`rounded-lg border px-2 py-1 ${metricClass}`}>
                            Sch: <span className="font-semibold">{item.scheduledGuides}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 text-[10px] text-muted-foreground/50">No data</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Planned vs Actual Attendance Trend */}
            {/* <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-6">
                <h3 className="text-sm font-bold font-heading">Summary Metrics</h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Key performance indicators for the selected team.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">Approved Leaves</div>
                  <div className="text-2xl font-black font-heading text-success">{summaryAnalyticsMetrics.approved}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">Pending Approvals</div>
                  <div className="text-2xl font-black font-heading text-warning">{summaryAnalyticsMetrics.pending}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">Week-Off Swaps</div>
                  <div className="text-2xl font-black font-heading text-info">{summaryAnalyticsMetrics.weekoffSwaps}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">High Risk Days</div>
                  <div className="text-2xl font-black font-heading text-destructive">{summaryAnalyticsMetrics.highRiskDays}</div>
                </div>
              </div>
            </div> */}
          </div>

          {/* Recommendation Card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold font-heading">
              <Target size={14} className="text-primary" /> Recommendations
            </h3>
            <div className="space-y-2.5">
              {[
                { severity: 'high', title: 'Critical Understaffing', desc: `More than ${summaryAnalyticsMetrics.highRiskDays} high-risk days detected this month` },
                { severity: 'medium', title: 'Pending Approvals Review', desc: `${summaryAnalyticsMetrics.pending} pending leave requests need review` },
                { severity: 'low', title: 'Optimize Coverage', desc: 'Consider week-off swap approvals to optimize team coverage' },
              ].map(item => (
                <div key={item.title} className="rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <span className={`h-2 w-2 rounded-full ${item.severity === 'high' ? 'bg-destructive' : item.severity === 'medium' ? 'bg-warning' : 'bg-info'}`} />
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {analyticsTab === 'departments' && (
        <div className="space-y-5">
           {/* Calendar Filters Card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div>
              <div className="text-sm font-bold font-heading">Apply Filters</div>
              <div className="text-[11px] text-muted-foreground">
                Filter by department and supervisor, and select a month to view targeted analytics.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Department</label>
                <select
                  value={selectedDepartmentId}
                  onChange={event => {
                    setSelectedDepartmentId(event.target.value);
                    setSelectedSupervisorId('all');
                  }}
                  className="glass-input text-sm w-full"
                >
                  <option value="all">All Departments</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Supervisor</label>
                <select
                  value={selectedSupervisorId}
                  onChange={event => setSelectedSupervisorId(event.target.value)}
                  className="glass-input text-sm w-full"
                >
                  <option value="all">All Supervisors</option>
                  {filteredSupervisors.map(supervisor => (
                    <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Selector */}
            <div className="grid grid-cols-3 items-center justify-between gap-3 mt-4">
              <div>
           <label className="block text-[10px] tracking-section text-center uppercase text-muted-foreground mb-1.5 font-semibold">Month</label>
              <input
                type="month"
                
                value={selectedMonthKey}
                onChange={event => setSelectedMonthKey(event.target.value)}
                className="glass-input text-sm flex-1 text-center "
              />
              </div>
              
               <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Date From</label>
                <input
                  type="date"
                  value={enterpriseDateFrom}
                  onChange={event => setEnterpriseDateFrom(event.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Date To</label>
                <input
                  type="date"
                  value={enterpriseDateTo}
                  onChange={event => setEnterpriseDateTo(event.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>
            </div>

          
          </div>
          {/* Summary Metrics */}
          <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <motion.div variants={staggerItem}><KpiCard label="Departments" value={summaryMetrics.departments} icon={<Building2 size={18} />} accent="primary" /></motion.div>
            <motion.div variants={staggerItem}><KpiCard label="Supervisors" value={summaryMetrics.supervisors} icon={<Users size={18} />} accent="accent" /></motion.div>
            <motion.div variants={staggerItem}><KpiCard label="Guides" value={summaryMetrics.guides} icon={<UserRound size={18} />} accent="info" /></motion.div>
            <motion.div variants={staggerItem}><KpiCard label="Approvals" value={summaryMetrics.leaves} icon={<BarChart3 size={18} />} accent="success" /></motion.div>
            <motion.div variants={staggerItem}><KpiCard label="Open Alerts" value={summaryMetrics.alerts} icon={<AlertTriangle size={18} />} accent="warning" /></motion.div>
          </motion.div>

         

          {/* Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {departmentRows.map(row => (
              <div key={row.id} className="bg-card border border-border rounded-xl p-5 space-y-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">{row.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{row.guides} guides • {row.supervisors} supervisors</div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${row.shrinkage > 8 ? 'bg-destructive/10 text-destructive border-destructive/15' : row.shrinkage > 5 ? 'bg-warning/10 text-warning border-warning/15' : 'bg-success/10 text-success border-success/15'}`}>
                    {row.shrinkage > 8 ? 'High Risk' : row.shrinkage > 5 ? 'Watch' : 'Stable'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Approved</div>
                    <div className="mt-1 font-semibold">{row.approved}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Pending</div>
                    <div className="mt-1 font-semibold">{row.pending}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="text-muted-foreground">Shrinkage</div>
                    <div className="mt-1 font-semibold">{row.shrinkage}%</div>
                  </div>
                  <button
                    onClick={() => {
                      const alert = forecastAlerts.find(a => a.departmentId === row.id && a.status === 'Open');
                      if (alert) {
                        setSelectedForecastAlert(alert as ForecastAlertDetail);
                      }
                    }}
                    disabled={row.alerts === 0}
                    className="rounded-xl border border-border bg-muted/20 p-3 text-xs hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="text-muted-foreground">Forecast Alerts</div>
                      <div className="mt-1 font-semibold">{row.alerts}</div>
                    </div>
                    {row.alerts > 0 && <Eye size={14} className="shrink-0 mt-0.5 text-warning" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {departmentRows.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <div className="text-sm font-semibold text-muted-foreground">No departments found</div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                Adjust your filters to view department analytics.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecast Alert Modal - Full Screen */}
      <AnimatePresence>
        {selectedForecastAlert && (
          <div className="fixed inset-0 z-50 flex flex-col">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedForecastAlert(null)}
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="relative z-10 w-full max-w-md mx-auto h-[70vh] my-auto bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur p-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold tracking-heading">Forecast Alert Details</h2>
                  <p className="text-xs text-muted-foreground mt-1">Complete forecast coverage and impact analysis</p>
                </div>
                <button
                  onClick={() => setSelectedForecastAlert(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto flex-1">
                <div className="p-4 space-y-4 max-w-md">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Alert Date</div>
                      <div className="mt-3 font-semibold text-2xl">{formatDate(selectedForecastAlert.date)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Status</div>
                      <div className="mt-3">
                        <span className="inline-flex px-4 py-2 rounded-lg bg-warning/10 text-warning text-sm font-bold border border-warning/15">{selectedForecastAlert.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Forecast Metrics Section */}
                  <div className="rounded-xl border border-info/20 bg-info/6 p-4 space-y-3">
                    <div className="text-xs font-semibold text-info uppercase tracking-wider">Forecast Coverage Analysis</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Forecast Volume</div>
                        <div className="mt-3 text-3xl font-black font-heading text-info">{selectedForecastAlert.forecastVolume}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Required Guides</div>
                        <div className="mt-3 text-3xl font-black font-heading">{selectedForecastAlert.requiredGuides}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Scheduled Guides</div>
                        <div className="mt-3 text-3xl font-black font-heading text-accent">{selectedForecastAlert.scheduledGuides}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Available After</div>
                        <div className={`mt-3 text-3xl font-black font-heading ${selectedForecastAlert.availableGuides < selectedForecastAlert.requiredGuides ? 'text-destructive' : 'text-success'}`}>
                          {selectedForecastAlert.availableGuides}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shrinkage Impact */}
                  <div className="rounded-xl border border-warning/20 bg-warning/6 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-semibold text-warning uppercase tracking-wider">Shrinkage Impact Assessment</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-background/80 p-2 text-center">
                        <div className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">Before</div>
                        <div className="mt-3 text-3xl font-black" style={{ color: '#10b981' }}>
                          {selectedForecastAlert.shrinkageBefore.toFixed(1)}%
                        </div>
                      </div>
                      <div className="rounded-lg bg-background/80 p-2 text-center flex items-center justify-center">
                        <span className="text-2xl text-warning">→</span>
                      </div>
                      <div className="rounded-lg bg-background/80 p-2 text-center">
                        <div className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">After</div>
                        <div className={`mt-3 text-3xl font-black ${selectedForecastAlert.shrinkageAfter > 8 ? 'text-destructive' : 'text-warning'}`}>
                          {selectedForecastAlert.shrinkageAfter.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground bg-background/40 p-2 rounded-lg">
                      {selectedForecastAlert.shrinkageAfter > selectedForecastAlert.shrinkageBefore
                        ? `⚠️ Shrinkage will increase by ${(selectedForecastAlert.shrinkageAfter - selectedForecastAlert.shrinkageBefore).toFixed(1)}% - review this impact carefully before approval.`
                        : `✓ Shrinkage will improve or remain stable - this is a favorable outcome.`}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {/* <div className="rounded-xl border border-primary/20 bg-primary/6 p-6">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">Recommended Action</div>
                    <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                      <p>
                        Based on the available guides <span className="font-semibold text-foreground">{selectedForecastAlert.availableGuides}</span> and required <span className="font-semibold text-foreground">{selectedForecastAlert.requiredGuides}</span>, the system {selectedForecastAlert.availableGuides >= selectedForecastAlert.requiredGuides ? 'can support' : 'may struggle with'} this request.
                      </p>
                      <p>
                        Review all pending approvals and consider any pending week-off swaps that could impact coverage.
                      </p>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur p-3 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setSelectedForecastAlert(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted/30"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
