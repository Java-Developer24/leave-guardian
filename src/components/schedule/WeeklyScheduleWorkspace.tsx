import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { useAppStore } from '@/state/store';
import SectionHeader from '@/components/SectionHeader';
import Modal from '@/components/modals/Modal';
import { formatDate, toDateStr } from '@/core/utils/dates';
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
    tag: 'Supervisor Schedule',
    title: 'Team Week',
    highlight: 'Planner',
    description: 'Review current and next month schedules, track weekly leave coverage, and request week-off swaps for your reporting guides.',
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
  const weekOptions = useMemo(() => getWeeksForMonth(visibleMonth), [visibleMonth]);

  useEffect(() => {
    const preferredWeek = monthView === 'current'
      ? startOfWeek(today)
      : weekOptions[0] ?? startOfWeek(visibleMonth);
    setSelectedWeekStart(toDateStr(preferredWeek));
  }, [monthView, today, visibleMonth, weekOptions]);

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
      .filter(request => filteredAgentIdSet.has(request.sourceGuideId) || filteredAgentIdSet.has(request.peerGuideId))
      .sort((a, b) => (b.history[0]?.at ?? '').localeCompare(a.history[0]?.at ?? ''));
  }, [weekoffSwapRequests, filteredAgentIdSet]);

  const selectedGuideRow = mode === 'supervisor'
    ? weekRows.find(row => row.agent.id === activeGuideId) ?? null
    : null;
  const peerGuideChoices = visibleAgents.filter(agent => agent.id !== activeGuideId);
  const peerGuideRow = weekRows.find(row => row.agent.id === peerGuideId) ?? null;

  const scopeDepartmentName = scopeDepartmentId === 'all'
    ? 'All Departments'
    : getDepartmentName(scopeDepartmentId);
  const scopeTeamName = selectedTeamId === 'all'
    ? 'All Teams'
    : getUserName(selectedTeamId);
  const weekLeaveCount = weekRows.reduce((count, row) => count + row.weekLeaves.length, 0);
  const weekOffCount = weekRows.reduce((count, row) => count + row.weekOffDates.length, 0);

  const handleSubmitSwap = async () => {
    if (!currentUser || !activeGuideId || !peerGuideId || !sourceDate || !peerDate || scopeDepartmentId === 'all') {
      showToast('Select both guides and both week-off dates first', 'error');
      return;
    }

    if (sourceDate === peerDate) {
      showToast('Choose different dates for the week-off swap', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await repo.createWeekoffSwapRequest({
        requesterId: currentUser.id,
        departmentId: scopeDepartmentId,
        sourceGuideId: activeGuideId,
        peerGuideId,
        sourceDate,
        peerDate,
        weekStart: selectedWeekStart,
        comment: comment.trim() || undefined,
      });
      await refreshWeekoffSwapRequests();
      showToast('Week-off swap request sent to admin', 'success');
      setActiveGuideId(null);
      setPeerGuideId('');
      setSourceDate('');
      setPeerDate('');
      setComment('');
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

          {mode !== 'supervisor' && (
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
          )}

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
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              mode === 'supervisor'
                ? 'bg-primary/10 border-primary/15'
                : 'bg-info/10 border-info/15'
            }`}>
              {mode === 'supervisor' ? (
                <ArrowLeftRight size={16} className="text-primary" />
              ) : (
                <Users size={16} className="text-info" />
              )}
            </div>
            <div>
              <div className="text-sm font-bold">
                {mode === 'supervisor' ? 'Week-Off Swap Queue' : 'Schedule Scope'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {mode === 'supervisor'
                  ? 'Supervisor requests waiting on admin approval.'
                  : 'Review the active department and team schedule scope.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="text-muted-foreground">
                {mode === 'supervisor' ? 'Pending Admin' : 'Guides Visible'}
              </div>
              <div className="mt-1 text-lg font-black font-heading">
                {mode === 'supervisor'
                  ? scopedWeekoffRequests.filter(request => request.status === 'PendingAdmin').length
                  : visibleAgents.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="text-muted-foreground">
                {mode === 'supervisor' ? 'Approved' : 'Leaves This Week'}
              </div>
              <div className="mt-1 text-lg font-black font-heading">
                {mode === 'supervisor'
                  ? scopedWeekoffRequests.filter(request => request.status === 'Approved').length
                  : weekLeaveCount}
              </div>
            </div>
            {mode !== 'supervisor' && (
              <>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="text-muted-foreground">Week Off Slots</div>
                  <div className="mt-1 text-lg font-black font-heading">{weekOffCount}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="text-muted-foreground">Teams In Scope</div>
                  <div className="mt-1 text-lg font-black font-heading">{visibleSupervisors.length}</div>
                </div>
              </>
            )}
          </div>

          {mode !== 'supervisor' && (
            <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">
                <Building2 size={12} className="text-primary" /> Current Scope
              </div>
              <div className="mt-2 text-sm font-semibold">{scopeDepartmentName}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {selectedTeamId === 'all' ? 'All teams in this department scope' : `${scopeTeamName} reporting group`}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {scopedWeekoffRequests.slice(0, 3).map(request => (
              <div key={request.id} className="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {getUserName(request.sourceGuideId)} to {getUserName(request.peerGuideId)}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                    request.status === 'Approved'
                      ? 'bg-success/10 text-success border-success/15'
                      : request.status === 'Rejected'
                        ? 'bg-destructive/10 text-destructive border-destructive/15'
                        : 'bg-warning/10 text-warning border-warning/15'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  {formatDate(request.sourceDate)} swapped with {formatDate(request.peerDate)}
                </div>
              </div>
            ))}
            {scopedWeekoffRequests.length === 0 && (
              <div className="rounded-xl border border-border bg-background/80 px-4 py-6 text-xs text-center text-muted-foreground">
                {mode === 'supervisor' ? 'No week-off swaps yet.' : 'No week-off swap activity in this scope yet.'}
              </div>
            )}
          </div>
        </div>
      </div>

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
          <div className="overflow-hidden">
            <table className="w-full table-fixed premium-table [&_th]:p-4 [&_th]:text-[11px] [&_td]:p-4">
              <colgroup>
                <col className={mode === 'supervisor' ? 'w-[18%]' : 'w-[22%]'} />
                {weekDays.map(day => (
                  <col key={toDateStr(day)} className="w-[8%]" />
                ))}
                <col className={mode === 'supervisor' ? 'w-[18%]' : 'w-[22%]'} />
                {mode === 'supervisor' && <col className="w-[8%]" />}
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
                  {mode === 'supervisor' && <th>Swap Week Off</th>}
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
                      {row.dayRows.map((dayRow, index) => (
                        <td key={`${row.agent.id}-${weekDays[index] ? toDateStr(weekDays[index]) : index}`} className="align-top">
                          {!dayRow ? (
                            <span className="text-[11px] text-muted-foreground/50">NA</span>
                          ) : dayRow.weekOff ? (
                            <span className="inline-flex rounded-full border border-warning/15 bg-warning/10 px-2.5 py-1 text-[10px] font-bold text-warning">
                              WO
                            </span>
                          ) : (
                            <div className="text-[11px] leading-tight">
                              <div className="font-semibold">
                                {dayRow.shiftStart.slice(0, 2)}-{dayRow.shiftEnd.slice(0, 2)}
                              </div>
                              <div className="text-muted-foreground">WK</div>
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="align-top">
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
                        <td className="align-top">
                          <button
                            onClick={() => {
                              setActiveGuideId(row.agent.id);
                              setPeerGuideId('');
                              setSourceDate(row.weekOffDates[0] ?? '');
                              setPeerDate('');
                              setComment('');
                            }}
                            disabled={row.weekOffDates.length === 0}
                            className="inline-flex rounded-xl border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted/30 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Swap Week Off
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
        <Modal open={!!selectedGuideRow} onClose={() => setActiveGuideId(null)} title="Request Week-Off Swap">
          {selectedGuideRow && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 font-heading">Selected Guide</div>
                <div className="mt-2 text-sm font-semibold">{selectedGuideRow.agent.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Week {formatDate(selectedWeekStart)} to {formatDate(weekEndKey)}
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Swap With Guide</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-xs font-semibold">{selectedGuideRow.agent.name} Week Off</div>
                  {selectedGuideRow.weekOffDates.length === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground text-center">
                      No week-off dates in this week.
                    </div>
                  ) : selectedGuideRow.weekOffDates.map(date => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSourceDate(date)}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                        sourceDate === date
                          ? 'border-primary/25 bg-primary/8 text-primary'
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold">{peerGuideRow?.agent.name ?? 'Peer'} Week Off</div>
                  {!peerGuideRow ? (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground text-center">
                      Select another guide to view available week-off days.
                    </div>
                  ) : peerGuideRow.weekOffDates.length === 0 ? (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground text-center">
                      No week-off dates available for this week.
                    </div>
                  ) : peerGuideRow.weekOffDates.map(date => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setPeerDate(date)}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                        peerDate === date
                          ? 'border-info/25 bg-info/8 text-info'
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-section uppercase text-muted-foreground mb-1.5 font-semibold">Comment</label>
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
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSubmitSwap}
                  disabled={submitting || !sourceDate || !peerDate || !peerGuideId}
                  className="px-5 py-2.5 rounded-xl btn-primary-gradient text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  <Send size={14} /> {submitting ? 'Sending...' : 'Send to Admin'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </motion.div>
  );
}
