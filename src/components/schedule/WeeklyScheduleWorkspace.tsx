import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import Modal from '@/components/modals/Modal';
import { formatDate, formatMonthYear, formatShiftRangeIST, getMonthKey, toDateStr } from '@/core/utils/dates';
import {
  getWeekoffAppliedTag,
  getWeekoffModeLabel,
  getWeekoffRequestDescription,
  getWeekoffResultSummary,
  getWeekoffScopeLabel,
} from '@/core/utils/weekoff';
import { showToast } from '@/components/toasts/ToastContainer';
import { ArrowLeftRight, Building2, Filter, Send, Users } from 'lucide-react';

export type SchedulePersona = 'supervisor' | 'manager' | 'admin';

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeeksForMonth(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const weeks: Date[] = [];
  let cursor = startOfWeek(first);

  while (cursor <= last) {
    weeks.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

const headerCopy: Record<SchedulePersona, { tag: string; title: string; highlight: string; description: string }> = {
  supervisor: {
    tag: 'Team Schedule',
    title: 'Team Week',
    highlight: 'Planner',
    description: 'Review current and next month schedules, track leave coverage, and manage week-off planning for your reporting guides.',
  },
  manager: {
    tag: 'Manager Schedule',
    title: 'Cross-Team',
    highlight: 'Schedule',
    description: 'View weekly guide schedules across departments and teams using department and team filters.',
  },
  admin: {
    tag: 'Admin Schedule',
    title: 'Enterprise',
    highlight: 'Schedule',
    description: 'Review weekly guide schedules across departments and teams with the same planning view used by supervisors.',
  },
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekdayName(date: string) {
  return WEEKDAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
}

function formatWeekdayWithDate(date: string) {
  return `${getWeekdayName(date)} • ${formatDate(date)}`;
}

function getRecurringWeekoffPattern(dates: string[]) {
  if (dates.length === 0) return null;

  const grouped = dates.reduce<Record<number, { count: number; sampleDate: string }>>((acc, date) => {
    const weekday = new Date(`${date}T00:00:00`).getDay();
    const current = acc[weekday];
    acc[weekday] = {
      count: (current?.count ?? 0) + 1,
      sampleDate: current?.sampleDate ?? date,
    };
    return acc;
  }, {});

  const best = Object.entries(grouped)
    .map(([weekday, value]) => ({ weekday: Number(weekday), ...value }))
    .sort((a, b) => b.count - a.count || a.weekday - b.weekday)[0];

  return best ? {
    weekday: best.weekday,
    label: WEEKDAY_NAMES[best.weekday],
    sampleDate: best.sampleDate,
    count: best.count,
  } : null;
}

function formatRecurringWeekoff(pattern: ReturnType<typeof getRecurringWeekoffPattern>) {
  if (!pattern) return 'No repeating week off found';
  return `${pattern.label} • regular repeating week off`;
}

export default function WeeklyScheduleWorkspace({ mode }: { mode: SchedulePersona }) {
  const {
    currentUser,
    users,
    departments,
    schedule,
    leaves,
    repo,
    weekoffSwapRequests,
    refreshWeekoffSwapRequests,
  } = useAppStore();

  const today = useMemo(() => new Date(), []);
  const monthPresets = useMemo(() => ([
    { id: 'current', label: 'Current Month', value: new Date(today.getFullYear(), today.getMonth(), 1) },
    { id: 'next', label: 'Next Month', value: new Date(today.getFullYear(), today.getMonth() + 1, 1) },
  ]), [today]);
  const defaultDepartmentId = currentUser?.departmentId ?? departments[0]?.id ?? 'all';

  const [monthView, setMonthView] = useState<'current' | 'next'>('current');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => toDateStr(startOfWeek(today)));
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(defaultDepartmentId);
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [peerGuideId, setPeerGuideId] = useState('');
  const [sourceDate, setSourceDate] = useState('');
  const [peerDate, setPeerDate] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [swapScope, setSwapScope] = useState<'Month' | 'Week'>('Week');
  const [swapMode, setSwapMode] = useState<'MonthSwap' | 'WeekMove' | 'WeekSwap'>('WeekSwap');
  const [historyYear, setHistoryYear] = useState(today.getFullYear());
  const [historyMonth, setHistoryMonth] = useState(today.getMonth());
  const [historyGuideId, setHistoryGuideId] = useState('');

  useEffect(() => {
    if (mode === 'supervisor') {
      setSelectedDepartmentId(currentUser?.departmentId ?? departments[0]?.id ?? 'all');
      setSelectedTeamId('all');
      return;
    }

    if (!selectedDepartmentId && defaultDepartmentId) {
      setSelectedDepartmentId(defaultDepartmentId);
    }
  }, [mode, currentUser, departments, defaultDepartmentId, selectedDepartmentId]);

  const visibleMonth = monthPresets.find(item => item.id === monthView)?.value ?? monthPresets[0].value;
  const visibleMonthKey = getMonthKey(visibleMonth);
  const weekOptions = useMemo(() => getWeeksForMonth(visibleMonth), [visibleMonth]);

  useEffect(() => {
    const preferredWeek = monthView === 'current'
      ? startOfWeek(today)
      : weekOptions[0] ?? startOfWeek(visibleMonth);
    setSelectedWeekStart(toDateStr(preferredWeek));
  }, [monthView, today, visibleMonth, weekOptions]);

  useEffect(() => {
    setHistoryYear(visibleMonth.getFullYear());
    setHistoryMonth(visibleMonth.getMonth());
  }, [visibleMonth]);

  useEffect(() => {
    if (swapScope === 'Month') {
      setSwapMode('MonthSwap');
      return;
    }
    if (swapMode === 'MonthSwap') {
      setSwapMode('WeekSwap');
    }
  }, [swapScope, swapMode]);

  const activeWeekStartDate = useMemo(() => new Date(`${selectedWeekStart}T00:00:00`), [selectedWeekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(activeWeekStartDate, index)),
    [activeWeekStartDate],
  );
  const weekEndKey = toDateStr(weekDays[6] ?? activeWeekStartDate);

  const supervisorsByDept = useMemo(() => {
    return departments.reduce<Record<string, typeof users>>((acc, department) => {
      acc[department.id] = users
        .filter(user => user.role === 'supervisor' && user.departmentId === department.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {});
  }, [departments, users]);

  const teamAssignments = useMemo(() => {
    const assignments: Record<string, string[]> = {};

    departments.forEach(department => {
      const departmentSupervisors = supervisorsByDept[department.id] ?? [];
      const departmentAgents = users
        .filter(user => user.role === 'agent' && user.departmentId === department.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (departmentSupervisors.length === 0) return;

      if (departmentSupervisors.length === 1) {
        assignments[departmentSupervisors[0].id] = departmentAgents.map(agent => agent.id);
        return;
      }

      departmentSupervisors.forEach(supervisor => {
        assignments[supervisor.id] = [];
      });

      departmentAgents.forEach((agent, index) => {
        const supervisor = departmentSupervisors[index % departmentSupervisors.length];
        assignments[supervisor.id].push(agent.id);
      });
    });

    return assignments;
  }, [departments, supervisorsByDept, users]);

  const scopeDepartmentId = mode === 'supervisor'
    ? currentUser?.departmentId ?? departments[0]?.id ?? 'all'
    : selectedDepartmentId || departments[0]?.id || 'all';

  const teamOptions = useMemo(() => {
    if (mode === 'supervisor') return [];
    if (scopeDepartmentId === 'all') {
      return users
        .filter(user => user.role === 'supervisor')
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return (supervisorsByDept[scopeDepartmentId] ?? []).sort((a, b) => a.name.localeCompare(b.name));
  }, [mode, scopeDepartmentId, supervisorsByDept, users]);

  useEffect(() => {
    if (mode === 'supervisor') return;
    if (selectedTeamId !== 'all' && !teamOptions.some(team => team.id === selectedTeamId)) {
      setSelectedTeamId('all');
    }
  }, [mode, selectedTeamId, teamOptions]);

  const filteredAgentIds = useMemo(() => {
    if (mode === 'supervisor') {
      return teamAssignments[currentUser?.id ?? '']
        ?? users.filter(user => user.role === 'agent' && user.departmentId === scopeDepartmentId).map(user => user.id);
    }

    if (selectedTeamId !== 'all') {
      const assignedIds = teamAssignments[selectedTeamId];
      if (assignedIds && assignedIds.length > 0) return assignedIds;

      const teamLead = users.find(user => user.id === selectedTeamId && user.role === 'supervisor');
      return users
        .filter(user => user.role === 'agent' && user.departmentId === teamLead?.departmentId)
        .map(user => user.id);
    }

    if (scopeDepartmentId === 'all') {
      return users.filter(user => user.role === 'agent').map(user => user.id);
    }

    return users
      .filter(user => user.role === 'agent' && user.departmentId === scopeDepartmentId)
      .map(user => user.id);
  }, [mode, currentUser, teamAssignments, users, scopeDepartmentId, selectedTeamId]);

  const filteredAgentIdSet = useMemo(() => new Set(filteredAgentIds), [filteredAgentIds]);

  const visibleAgents = useMemo(() => {
    return users
      .filter(user => user.role === 'agent' && filteredAgentIdSet.has(user.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, filteredAgentIdSet]);

  useEffect(() => {
    if (activeGuideId) {
      setHistoryGuideId(activeGuideId);
    }
  }, [activeGuideId]);

  const visibleSupervisors = useMemo(() => {
    if (mode === 'supervisor') {
      return users.filter(user => user.id === currentUser?.id);
    }
    if (selectedTeamId !== 'all') {
      return users.filter(user => user.id === selectedTeamId);
    }
    if (scopeDepartmentId === 'all') {
      return users.filter(user => user.role === 'supervisor');
    }
    return users.filter(user => user.role === 'supervisor' && user.departmentId === scopeDepartmentId);
  }, [mode, currentUser, users, selectedTeamId, scopeDepartmentId]);

  const getUserName = (id: string) => users.find(user => user.id === id)?.name ?? id;
  const getDepartmentName = (departmentId?: string) => departments.find(department => department.id === departmentId)?.name ?? 'Department';

  const weekRows = useMemo(() => {
    return visibleAgents.map(agent => {
      const dayRows = weekDays.map(day => {
        const date = toDateStr(day);
        return schedule.find(item => item.userId === agent.id && item.date === date) ?? null;
      });

      const weekLeaves = leaves
        .filter(leave =>
          leave.requesterId === agent.id &&
          leave.date >= selectedWeekStart &&
          leave.date <= weekEndKey &&
          !['Rejected', 'Cancelled'].includes(leave.status),
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        agent,
        dayRows,
        weekLeaves,
        weekOffDates: dayRows.filter(Boolean).filter(item => item?.weekOff).map(item => item!.date),
      };
    });
  }, [visibleAgents, weekDays, schedule, leaves, selectedWeekStart, weekEndKey]);

  const scopedWeekoffRequests = useMemo(() => {
    return weekoffSwapRequests
      .filter(request => {
        if (mode === 'supervisor') {
          return request.departmentId === scopeDepartmentId;
        }
        return filteredAgentIdSet.has(request.sourceGuideId) || filteredAgentIdSet.has(request.peerGuideId);
      })
      .sort((a, b) => (b.history[0]?.at ?? '').localeCompare(a.history[0]?.at ?? ''));
  }, [weekoffSwapRequests, filteredAgentIdSet, mode, scopeDepartmentId]);

  const selectedGuideRow = mode === 'supervisor'
    ? weekRows.find(row => row.agent.id === activeGuideId) ?? null
    : null;
  const peerGuideChoices = visibleAgents.filter(agent => agent.id !== activeGuideId);
  const peerGuideRow = weekRows.find(row => row.agent.id === peerGuideId) ?? null;
  const approvedWeekoffRequests = useMemo(
    () => scopedWeekoffRequests.filter(request => request.status === 'Approved'),
    [scopedWeekoffRequests],
  );
  const selectedGuideMonthRows = useMemo(() => {
    if (!activeGuideId) return [];
    return schedule
      .filter(row => row.userId === activeGuideId && row.date.startsWith(visibleMonthKey))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule, activeGuideId, visibleMonthKey]);
  const peerGuideMonthRows = useMemo(() => {
    if (!peerGuideId) return [];
    return schedule
      .filter(row => row.userId === peerGuideId && row.date.startsWith(visibleMonthKey))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule, peerGuideId, visibleMonthKey]);
  const selectedGuideMonthOffDates = useMemo(
    () => selectedGuideMonthRows.filter(row => row.weekOff).map(row => row.date),
    [selectedGuideMonthRows],
  );
  const peerGuideMonthOffDates = useMemo(
    () => peerGuideMonthRows.filter(row => row.weekOff).map(row => row.date),
    [peerGuideMonthRows],
  );
  const selectedGuideWeekMoveTargets = useMemo(
    () => (selectedGuideRow?.dayRows ?? [])
      .filter(Boolean)
      .filter(row => !row?.weekOff)
      .map(row => row!.date),
    [selectedGuideRow],
  );
  const selectedGuideRecurringWeekoff = useMemo(
    () => getRecurringWeekoffPattern(selectedGuideMonthOffDates),
    [selectedGuideMonthOffDates],
  );
  const peerGuideRecurringWeekoff = useMemo(
    () => getRecurringWeekoffPattern(peerGuideMonthOffDates),
    [peerGuideMonthOffDates],
  );
  const historyMonthKey = `${historyYear}-${String(historyMonth + 1).padStart(2, '0')}`;
  const historyYearOptions = useMemo(() => Array.from(new Set(
    [...schedule.map(row => row.date.slice(0, 4)), ...weekoffSwapRequests.map(request => request.sourceDate.slice(0, 4))]
      .map(Number),
  )).sort((a, b) => a - b), [schedule, weekoffSwapRequests]);
  const guideHistoryRows = useMemo(() => {
    return approvedWeekoffRequests
      .filter(request =>
        (request.monthKey ?? request.sourceDate.slice(0, 7)) === historyMonthKey &&
        (!historyGuideId || request.sourceGuideId === historyGuideId || request.peerGuideId === historyGuideId),
      )
      .sort((a, b) => (b.history[b.history.length - 1]?.at ?? '').localeCompare(a.history[a.history.length - 1]?.at ?? ''));
  }, [approvedWeekoffRequests, historyMonthKey, historyGuideId]);
  const pendingWeekoffQueue = useMemo(
    () => scopedWeekoffRequests.filter(request => request.status === 'PendingAdmin'),
    [scopedWeekoffRequests],
  );
  const historyFallbackRows = useMemo(() => {
    if (guideHistoryRows.length > 0 || historyGuideId) return [];
    return [...approvedWeekoffRequests]
      .sort((a, b) => (b.history[b.history.length - 1]?.at ?? '').localeCompare(a.history[a.history.length - 1]?.at ?? ''))
      .slice(0, 4);
  }, [guideHistoryRows, historyGuideId, approvedWeekoffRequests]);
  const visibleHistoryRows = guideHistoryRows.length > 0 ? guideHistoryRows : historyFallbackRows;

  useEffect(() => {
    if (!selectedGuideRow && selectedGuideMonthOffDates.length === 0) return;

    if (swapScope === 'Month') {
      setSourceDate(selectedGuideRecurringWeekoff?.sampleDate ?? selectedGuideMonthOffDates[0] ?? '');
      return;
    }

    if (swapMode === 'WeekMove') {
      const preferredSource = selectedGuideRow?.weekOffDates[0] ?? '';
      const preferredTarget = selectedGuideWeekMoveTargets.find(date => date !== preferredSource) ?? selectedGuideWeekMoveTargets[0] ?? '';
      setSourceDate(preferredSource);
      setPeerDate(preferredTarget);
      return;
    }

    setSourceDate(selectedGuideRow?.weekOffDates[0] ?? '');
  }, [selectedGuideRecurringWeekoff, selectedGuideRow, selectedGuideMonthOffDates, selectedGuideWeekMoveTargets, swapMode, swapScope]);

  useEffect(() => {
    if (swapScope === 'Month') {
      setPeerDate(peerGuideRecurringWeekoff?.sampleDate ?? peerGuideMonthOffDates[0] ?? '');
      return;
    }

    if (swapMode === 'WeekSwap') {
      setPeerDate(peerGuideRow?.weekOffDates[0] ?? '');
    }
  }, [peerGuideMonthOffDates, peerGuideRecurringWeekoff, peerGuideRow, swapMode, swapScope]);

  const scopeDepartmentName = scopeDepartmentId === 'all'
    ? 'All Departments'
    : getDepartmentName(scopeDepartmentId);
  const scopeTeamName = selectedTeamId === 'all'
    ? 'All Teams'
    : getUserName(selectedTeamId);
  const weekLeaveCount = weekRows.reduce((count, row) => count + row.weekLeaves.length, 0);
  const weekOffCount = weekRows.reduce((count, row) => count + row.weekOffDates.length, 0);

  const handleSubmitSwap = async () => {
    if (!currentUser || !activeGuideId || !sourceDate || !peerDate || scopeDepartmentId === 'all') {
      showToast('Select the guide and week-off dates first', 'error');
      return;
    }

    if ((swapScope === 'Month' || swapMode === 'WeekSwap') && !peerGuideId) {
      showToast('Select the paired guide first', 'error');
      return;
    }

    if (sourceDate === peerDate) {
      showToast('Choose different dates for the week-off change', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await repo.createWeekoffSwapRequest({
        requesterId: currentUser.id,
        departmentId: scopeDepartmentId,
        sourceGuideId: activeGuideId,
        peerGuideId: swapMode === 'WeekMove' ? undefined : peerGuideId,
        sourceDate,
        peerDate,
        weekStart: selectedWeekStart,
        mode: swapScope === 'Month' ? 'MonthSwap' : swapMode,
        periodType: swapScope,
        monthKey: visibleMonthKey,
        comment: comment.trim() || undefined,
      });
      await refreshWeekoffSwapRequests();
      showToast('Week-off swap request sent to admin', 'success');
      setActiveGuideId(null);
      setPeerGuideId('');
      setSourceDate('');
      setPeerDate('');
      setComment('');
      setSwapScope('Week');
      setSwapMode('WeekSwap');
    } catch {
      showToast('Failed to submit week-off swap request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = headerCopy[mode];

  return (
    <motion.div {...pageTransition}>
      <SectionHeader
        tag={copy.tag}
        title={copy.title}
        highlight={copy.highlight}
        description={copy.description}
      />

      {mode === 'supervisor' ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {monthPresets.map(option => (
                <button
                  key={option.id}
                  onClick={() => setMonthView(option.id as 'current' | 'next')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    monthView === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background hover:bg-muted/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Active Month</div>
              <div className="text-sm font-semibold">
                {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {weekOptions.map(weekStart => {
              const key = toDateStr(weekStart);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedWeekStart(key)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    selectedWeekStart === key
                      ? 'bg-info/12 text-info border border-info/20'
                      : 'bg-background border border-border hover:bg-muted/30'
                  }`}
                >
                  {formatWeekRange(weekStart)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.72fr)_320px] gap-5 mb-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {monthPresets.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setMonthView(option.id as 'current' | 'next')}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      monthView === option.id
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-background hover:bg-muted/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Active Month</div>
                <div className="text-sm font-semibold">
                  {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end">
              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Department</label>
                <select
                  value={selectedDepartmentId}
                  onChange={event => {
                    setSelectedDepartmentId(event.target.value);
                    setSelectedTeamId('all');
                  }}
                  className="glass-input text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Team</label>
                <select
                  value={selectedTeamId}
                  onChange={event => setSelectedTeamId(event.target.value)}
                  className="glass-input text-sm"
                >
                  <option value="all">All Teams</option>
                  {teamOptions.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-xs text-muted-foreground flex items-center gap-2">
                <Filter size={14} className="text-primary" />
                Team filter uses supervisor reporting groups.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {weekOptions.map(weekStart => {
                const key = toDateStr(weekStart);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedWeekStart(key)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      selectedWeekStart === key
                        ? 'bg-info/12 text-info border border-info/20'
                        : 'bg-background border border-border hover:bg-muted/30'
                    }`}
                  >
                    {formatWeekRange(weekStart)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-info/10 border-info/15">
                <Users size={16} className="text-info" />
              </div>
              <div>
                <div className="text-sm font-bold">Schedule Scope</div>
                <div className="text-[11px] text-muted-foreground">
                  Review the active department and team schedule scope.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Guides Visible</div>
                <div className="mt-1 text-lg font-black font-heading">{visibleAgents.length}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Leaves This Week</div>
                <div className="mt-1 text-lg font-black font-heading">{weekLeaveCount}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Week Off Slots</div>
                <div className="mt-1 text-lg font-black font-heading">{weekOffCount}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-muted-foreground">Teams In Scope</div>
                <div className="mt-1 text-lg font-black font-heading">{visibleSupervisors.length}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">
                <Building2 size={12} className="text-primary" /> Current Scope
              </div>
              <div className="mt-2 text-sm font-semibold">{scopeDepartmentName}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {selectedTeamId === 'all' ? 'All teams in this department scope' : `${scopeTeamName} reporting group`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold font-heading">Weekly Guide Schedule</div>
            <div className="text-[11px] text-muted-foreground">
              {formatDate(selectedWeekStart)} to {formatDate(weekEndKey)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {visibleAgents.length} {mode === 'supervisor' ? 'reporting guides' : 'guides in scope'}
          </div>
        </div>

        {weekRows.length === 0 ? (
          <div className="px-5 py-10 text-sm text-center text-muted-foreground">
            No guide schedules found for the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1360px] w-full table-auto premium-table [&_th]:whitespace-nowrap [&_th]:p-4 [&_th]:text-[11px] [&_td]:align-top [&_td]:whitespace-normal [&_td]:p-4">
              <colgroup>
                <col className={mode === 'supervisor' ? 'w-[220px]' : 'w-[240px]'} />
                {weekDays.map(day => (
                  <col key={toDateStr(day)} className="w-[140px]" />
                ))}
                <col className={mode === 'supervisor' ? 'w-[260px]' : 'w-[280px]'} />
                {mode === 'supervisor' && <col className="w-[160px]" />}
              </colgroup>
              <thead>
                <tr>
                  <th>Guide</th>
                  {weekDays.map(day => (
                    <th key={toDateStr(day)}>
                      {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </th>
                  ))}
                  <th>Leaves Applied</th>
                  {mode === 'supervisor' && <th>Manage Week Off</th>}
                </tr>
              </thead>
              <tbody>
                {weekRows.map(row => {
                  const showDepartmentLabel = mode !== 'supervisor' && scopeDepartmentId === 'all';

                  return (
                    <tr key={row.agent.id}>
                      <td className="font-semibold align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {row.agent.name.split(' ').map(name => name[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate">{row.agent.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {showDepartmentLabel
                                ? `${getDepartmentName(row.agent.departmentId)} • ${row.weekOffDates.length} week off`
                                : `${row.weekOffDates.length} week off`}
                            </div>
                          </div>
                        </div>
                      </td>
                      {row.dayRows.map((dayRow, index) => {
                        const cellDate = weekDays[index] ? toDateStr(weekDays[index]) : '';
                        const dayLeave = row.weekLeaves.find(leave => leave.date === cellDate) ?? null;
                        const weekoffTag = approvedWeekoffRequests
                          .map(request => getWeekoffAppliedTag(request, row.agent.id, cellDate))
                          .find(Boolean);

                        return (
                          <td key={`${row.agent.id}-${cellDate || index}`} className="align-top whitespace-normal">
                            {!dayRow ? (
                              <span className="text-[11px] text-muted-foreground/50">NA</span>
                            ) : dayLeave ? (
                              <div className="rounded-xl border border-info/20 bg-info/10 px-2.5 py-2 text-[10px]">
                                <div className="font-bold text-info">{dayLeave.type} Leave</div>
                                <div className="mt-1 text-info/80">{dayLeave.status}</div>
                              </div>
                            ) : dayRow.weekOff ? (
                              <div className={`rounded-xl border px-2.5 py-2 text-[10px] ${
                                weekoffTag === 'monthSwap'
                                  ? 'border-primary/20 bg-primary/10 text-primary'
                                  : weekoffTag === 'weekMove'
                                    ? 'border-info/20 bg-info/10 text-info'
                                    : weekoffTag === 'weekSwap'
                                      ? 'border-accent/20 bg-accent/10 text-accent'
                                      : 'border-warning/15 bg-warning/10 text-warning'
                              }`}>
                                <div className="font-bold">
                                  {weekoffTag === 'monthSwap'
                                    ? 'WO Swap'
                                    : weekoffTag === 'weekMove'
                                      ? 'WO Move'
                                      : weekoffTag === 'weekSwap'
                                        ? 'WO Swap'
                                        : 'Week Off'}
                                </div>
                                <div className="mt-1 opacity-80">
                                  {weekoffTag === 'monthSwap'
                                    ? 'Month swap'
                                    : weekoffTag === 'weekMove'
                                      ? 'Moved off'
                                      : weekoffTag === 'weekSwap'
                                        ? 'Swapped off'
                                        : 'Regular'}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-border/50 bg-background/70 px-2.5 py-2 text-[10px] leading-tight">
                                <div className="font-semibold">{formatShiftRangeIST(dayRow.shiftStart, dayRow.shiftEnd)}</div>
                                <div className="mt-1 text-muted-foreground">Working day</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="align-top whitespace-normal">
                        <div className="flex flex-wrap gap-1">
                          {row.weekLeaves.length === 0 ? (
                            <span className="text-[11px] text-muted-foreground/60">No leave</span>
                          ) : row.weekLeaves.slice(0, 3).map(leave => (
                            <span key={leave.id} className="inline-flex rounded-full border border-info/15 bg-info/10 px-2.5 py-1 text-[10px] font-semibold text-info">
                              {new Date(leave.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                            </span>
                          ))}
                          {row.weekLeaves.length > 3 && (
                            <span className="inline-flex rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                              +{row.weekLeaves.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      {mode === 'supervisor' && (
                        <td className="align-top whitespace-normal">
                          <button
                            onClick={() => {
                              setActiveGuideId(row.agent.id);
                              setPeerGuideId('');
                              setSourceDate(row.weekOffDates[0] ?? '');
                              setPeerDate('');
                              setComment('');
                              setSwapScope('Week');
                              setSwapMode('WeekSwap');
                            }}
                            disabled={row.weekOffDates.length === 0}
                            className="inline-flex rounded-xl border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted/30 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Manage
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mode === 'supervisor' && (
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-bold font-heading">Week-Off Change History</div>
              <div className="text-[11px] text-muted-foreground">
                Review month swaps, week moves, and week swaps for each guide across different months.
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select value={historyGuideId} onChange={event => setHistoryGuideId(event.target.value)} className="glass-input text-sm">
                <option value="">All guides</option>
                {visibleAgents.map(agent => (
                  <option key={`history-guide-${agent.id}`} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <select value={historyMonth} onChange={event => setHistoryMonth(Number(event.target.value))} className="glass-input text-sm">
                {Array.from({ length: 12 }, (_, monthIndex) => (
                  <option key={`history-month-${monthIndex}`} value={monthIndex}>
                    {new Date(2026, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select value={historyYear} onChange={event => setHistoryYear(Number(event.target.value))} className="glass-input text-sm">
                {historyYearOptions.map(year => (
                  <option key={`history-year-${year}`} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {visibleHistoryRows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No approved week-off changes found for this month and guide selection.
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5">
              {historyFallbackRows.length > 0 ? (
                <div className="rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-xs text-info">
                  No approved records were found for the exact month filter, so the latest approved week-off examples are shown below.
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <div className="text-muted-foreground">Visible History Records</div>
                  <div className="mt-1 text-lg font-black font-heading">{visibleHistoryRows.length}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <div className="text-muted-foreground">Selected Month</div>
                  <div className="mt-1 text-sm font-semibold">{formatMonthYear(historyMonthKey)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <div className="text-muted-foreground">Guide Filter</div>
                  <div className="mt-1 text-sm font-semibold">{historyGuideId ? getUserName(historyGuideId) : 'All guides'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {visibleHistoryRows.map(request => (
                <div key={`history-row-${request.id}`} className="rounded-2xl border border-border bg-gradient-to-br from-muted/30 to-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Guide Pair</div>
                      <div className="mt-1 text-sm font-bold">{getUserName(request.sourceGuideId)}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {request.peerGuideId ? `Matched with ${getUserName(request.peerGuideId)}` : 'Single-guide week-off movement'}
                      </div>
                    </div>
                    <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[10px] font-bold text-success">
                      Approved
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Change Type</div>
                      <div className="mt-1 font-semibold">{getWeekoffModeLabel(request)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Scope</div>
                      <div className="mt-1 font-semibold">{getWeekoffScopeLabel(request)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Requested On</div>
                      <div className="mt-1 font-semibold">{formatDate(request.history[0]?.at ?? request.sourceDate)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Approved On</div>
                      <div className="mt-1 font-semibold">{formatDate(request.history[request.history.length - 1]?.at ?? request.sourceDate)}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="rounded-xl border border-border bg-background/80 p-3 text-xs">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Approved Result</div>
                      <div className="mt-2 font-semibold">{getWeekoffResultSummary(request, getUserName)}</div>
                      {request.comment ? (
                        <div className="mt-2 text-muted-foreground">Comment: {request.comment}</div>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-info/15 bg-info/8 p-3 text-xs">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-info/70 font-heading">Change Snapshot</div>
                      <div className="mt-2 font-semibold">{getWeekoffRequestDescription(request, getUserName)}</div>
                      <div className="mt-2 text-muted-foreground">
                        Applied tag: {getWeekoffModeLabel(request)} in {getWeekoffScopeLabel(request)}.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'supervisor' && (
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold font-heading">
                <ArrowLeftRight size={15} className="text-primary" /> Week-Off Swap Queue
              </div>
              <div className="text-[11px] text-muted-foreground">
                Pending week-off planning requests waiting for admin review.
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Pending Requests</div>
              <div className="text-sm font-semibold">{pendingWeekoffQueue.length}</div>
            </div>
          </div>

          {pendingWeekoffQueue.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No pending week-off planning requests in the current team scope.
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <div className="text-muted-foreground">Queue Items</div>
                  <div className="mt-1 text-lg font-black font-heading">{pendingWeekoffQueue.length}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <div className="text-muted-foreground">Month In View</div>
                  <div className="mt-1 text-sm font-semibold">{formatMonthYear(visibleMonthKey)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <div className="text-muted-foreground">Request Type Mix</div>
                  <div className="mt-1 text-sm font-semibold">
                    {Array.from(new Set(pendingWeekoffQueue.map(request => getWeekoffModeLabel(request)))).join(' • ')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {pendingWeekoffQueue.map(request => (
                <div key={`queue-row-${request.id}`} className="rounded-2xl border border-border bg-gradient-to-br from-warning/8 to-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Pending Pair</div>
                      <div className="mt-1 text-sm font-bold">{getUserName(request.sourceGuideId)}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {request.peerGuideId ? `Requested with ${getUserName(request.peerGuideId)}` : 'Single-guide change'}
                      </div>
                    </div>
                    <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[10px] font-bold text-warning">
                      Pending Admin
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Change Type</div>
                      <div className="mt-1 font-semibold">{getWeekoffModeLabel(request)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Scope</div>
                      <div className="mt-1 font-semibold">{getWeekoffScopeLabel(request)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Submitted On</div>
                      <div className="mt-1 font-semibold">{formatDate(request.history[0]?.at ?? request.sourceDate)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="text-muted-foreground">Requested By</div>
                      <div className="mt-1 font-semibold">{getUserName(request.requesterId)}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="rounded-xl border border-border bg-background/80 p-3 text-xs">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Request Details</div>
                      <div className="mt-2 font-semibold">{getWeekoffRequestDescription(request, getUserName)}</div>
                      {request.comment ? (
                        <div className="mt-2 text-muted-foreground">Comment: {request.comment}</div>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-xs">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-warning/70 font-heading">Admin Review Focus</div>
                      <div className="mt-2 font-semibold">
                        Validate coverage for {request.periodType === 'Month' ? 'the repeating month pattern' : 'the selected week window'} before final approval.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'supervisor' && (
        <Modal
          open={!!selectedGuideRow}
          onClose={() => {
            setActiveGuideId(null);
            setPeerGuideId('');
            setComment('');
            setSwapScope('Week');
            setSwapMode('WeekSwap');
          }}
          title="Week-Off Planning"
        >
          {selectedGuideRow && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Selected Guide</div>
                <div className="mt-2 text-sm font-semibold">{selectedGuideRow.agent.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {swapScope === 'Month'
                    ? `${formatMonthYear(visibleMonth)} planning`
                    : `Week ${formatDate(selectedWeekStart)} to ${formatDate(weekEndKey)}`}
                </div>
                {swapScope === 'Month' && selectedGuideRecurringWeekoff ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Regular week off: {selectedGuideRecurringWeekoff.label}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Week', label: 'Week', description: 'Use a single week for a move or a swap.' },
                    { id: 'Month', label: 'Month', description: 'Swap the full month week-off pattern with another guide.' },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSwapScope(option.id as 'Month' | 'Week');
                        setPeerGuideId('');
                        setComment('');
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        swapScope === option.id
                          ? 'border-primary/25 bg-primary/8 text-primary'
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="mt-1 text-[11px] opacity-80">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {swapScope === 'Week' && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Select Week</label>
                  <div className="flex flex-wrap gap-2">
                    {weekOptions.map(weekStart => {
                      const key = toDateStr(weekStart);
                      return (
                        <button
                          key={`modal-week-${key}`}
                          type="button"
                          onClick={() => setSelectedWeekStart(key)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            selectedWeekStart === key
                              ? 'border border-info/20 bg-info/12 text-info'
                              : 'border border-border bg-background hover:bg-muted/30'
                          }`}
                        >
                          {formatWeekRange(weekStart)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Week-Off Change Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {(swapScope === 'Month'
                    ? [
                      {
                        id: 'MonthSwap',
                        label: 'Swap week off',
                        description: 'Swap the entire month week-off pattern with another guide.',
                      },
                    ]
                    : [
                      {
                        id: 'WeekMove',
                        label: 'Move week off',
                        description: 'Move one guide week off within the selected week. Pending with validation.',
                      },
                      {
                        id: 'WeekSwap',
                        label: 'Swap week off',
                        description: 'Swap one week off between two specific guides in the selected week.',
                      },
                    ]).map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSwapMode(option.id as 'MonthSwap' | 'WeekMove' | 'WeekSwap');
                        if (option.id === 'WeekMove') setPeerGuideId('');
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        swapMode === option.id
                          ? 'border-primary/25 bg-primary/8 text-primary'
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="mt-1 text-[11px] opacity-80">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(swapScope === 'Month' || swapMode === 'WeekSwap') && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Swap With Guide</label>
                  <select
                    value={peerGuideId}
                    onChange={event => {
                      setPeerGuideId(event.target.value);
                      setPeerDate('');
                    }}
                    className="glass-input text-sm"
                  >
                    <option value="">Select a guide...</option>
                    {peerGuideChoices.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {swapMode === 'WeekMove' && (
                <div className="rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-xs text-info">
                  Validation note: this move keeps the request on the same guide and will still go to admin for review before the schedule changes.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-xs font-semibold">
                    {selectedGuideRow.agent.name} {swapScope === 'Month' ? 'Regular Week Off' : 'Week Off'}
                  </div>
                  {swapScope === 'Month' ? (
                    !selectedGuideRecurringWeekoff ? (
                      <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                        No regular week-off pattern found in this selection.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSourceDate(selectedGuideRecurringWeekoff.sampleDate)}
                        className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                          sourceDate === selectedGuideRecurringWeekoff.sampleDate
                            ? 'border-primary/25 bg-primary/8 text-primary'
                            : 'border-border bg-background hover:bg-muted/30'
                        }`}
                      >
                        {formatRecurringWeekoff(selectedGuideRecurringWeekoff)}
                        <div className="mt-1 opacity-80">
                          {selectedGuideRecurringWeekoff.count} week-off occurrence{selectedGuideRecurringWeekoff.count === 1 ? '' : 's'} in {formatMonthYear(visibleMonth)}
                        </div>
                      </button>
                    )
                  ) : selectedGuideRow.weekOffDates.length === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                      No week-off dates available in this week.
                    </div>
                  ) : (
                    selectedGuideRow.weekOffDates.map(date => (
                      <button
                        key={`source-${date}`}
                        type="button"
                        onClick={() => setSourceDate(date)}
                        className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                          sourceDate === date
                            ? 'border-primary/25 bg-primary/8 text-primary'
                            : 'border-border bg-background hover:bg-muted/30'
                        }`}
                      >
                        {formatWeekdayWithDate(date)}
                      </button>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold">
                    {swapMode === 'WeekMove'
                      ? `${selectedGuideRow.agent.name} New Week Off`
                      : `${peerGuideId ? getUserName(peerGuideId) : 'Peer'} ${swapScope === 'Month' ? 'Regular Week Off' : 'Week Off'}`}
                  </div>
                  {swapMode === 'WeekMove' ? (
                    selectedGuideWeekMoveTargets.length === 0 ? (
                      <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                        No alternate workday is available in this week.
                      </div>
                    ) : (
                      selectedGuideWeekMoveTargets.map(date => (
                        <button
                          key={`target-${date}`}
                          type="button"
                          onClick={() => setPeerDate(date)}
                          className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                            peerDate === date
                              ? 'border-info/25 bg-info/8 text-info'
                              : 'border-border bg-background hover:bg-muted/30'
                          }`}
                        >
                          {formatWeekdayWithDate(date)}
                        </button>
                      ))
                    )
                  ) : (
                    swapScope === 'Month' ? (
                      !peerGuideId ? (
                        <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                          Select another guide to view the regular week-off pattern.
                        </div>
                      ) : !peerGuideRecurringWeekoff ? (
                        <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                          No regular week-off pattern available for this selection.
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPeerDate(peerGuideRecurringWeekoff.sampleDate)}
                          className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                            peerDate === peerGuideRecurringWeekoff.sampleDate
                              ? 'border-info/25 bg-info/8 text-info'
                              : 'border-border bg-background hover:bg-muted/30'
                          }`}
                        >
                          {formatRecurringWeekoff(peerGuideRecurringWeekoff)}
                          <div className="mt-1 opacity-80">
                            {peerGuideRecurringWeekoff.count} week-off occurrence{peerGuideRecurringWeekoff.count === 1 ? '' : 's'} in {formatMonthYear(visibleMonth)}
                          </div>
                        </button>
                      )
                    ) : !peerGuideRow ? (
                      <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                        Select another guide to view available week-off days.
                      </div>
                    ) : (peerGuideRow.weekOffDates ?? []).length === 0 ? (
                      <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center text-xs text-muted-foreground">
                        No week-off dates available for this selection.
                      </div>
                    ) : (
                      (peerGuideRow.weekOffDates ?? []).map(date => (
                      <button
                        key={`peer-${date}`}
                        type="button"
                        onClick={() => setPeerDate(date)}
                        className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                          peerDate === date
                            ? 'border-info/25 bg-info/8 text-info'
                            : 'border-border bg-background hover:bg-muted/30'
                        }`}
                      >
                        {formatWeekdayWithDate(date)}
                      </button>
                      ))
                    )
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/80 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Post Week-Off Summary</div>
                <div className="mt-2 text-sm font-semibold">
                  {swapScope === 'Month'
                    ? selectedGuideRecurringWeekoff && peerGuideRecurringWeekoff
                      ? `${selectedGuideRow.agent.name} currently has ${selectedGuideRecurringWeekoff.label} as the regular week off and ${peerGuideId ? getUserName(peerGuideId) : 'the selected guide'} currently has ${peerGuideRecurringWeekoff.label}. After approval, those repeating week-off days will swap for ${formatMonthYear(visibleMonth)}.`
                      : `${selectedGuideRow.agent.name} swaps the regular ${formatMonthYear(visibleMonth)} week-off pattern with ${peerGuideId ? getUserName(peerGuideId) : 'the selected guide'}.`
                    : swapMode === 'WeekMove'
                      ? `${selectedGuideRow.agent.name} moves the week off from ${sourceDate ? formatWeekdayWithDate(sourceDate) : 'the current off day'} to ${peerDate ? formatWeekdayWithDate(peerDate) : 'the selected workday'}.`
                      : `${selectedGuideRow.agent.name} swaps ${sourceDate ? formatWeekdayWithDate(sourceDate) : 'the selected off day'} with ${peerGuideId ? getUserName(peerGuideId) : 'the paired guide'} on ${peerDate ? formatWeekdayWithDate(peerDate) : 'their selected off day'}.`}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Admin approval is still required before the updated week-off pattern appears in the published schedule.
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Comment</label>
                <textarea
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  rows={3}
                  className="glass-input resize-none text-sm"
                  placeholder="Add a reason for admin review..."
                />
              </div>

              <div className="rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-xs text-info">
                This request goes to admin approval first. The team dashboard updates only after admin approval.
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveGuideId(null)}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/30"
                >
                  Close
                </button>
                <button
                  onClick={handleSubmitSwap}
                  disabled={submitting || !sourceDate || !peerDate || ((swapScope === 'Month' || swapMode === 'WeekSwap') && !peerGuideId)}
                  className="flex items-center gap-2 rounded-xl btn-primary-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
                >
                  <Send size={14} /> {submitting ? 'Sending...' : 'Send for Admin Approval'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </motion.div>
  );
}
