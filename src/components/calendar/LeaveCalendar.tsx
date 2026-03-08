import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getDaysInMonth, toDateStr } from '@/core/utils/dates';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  month: number;
  year: number;
  holidays: Record<string, string>;
  blockedDates: Set<string>;
  requestedDates: Set<string>;
  approvedDates: Set<string>;
  selectedDates: string[];
  onSelect: (dates: string[]) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LeaveCalendar({
  month, year, holidays, blockedDates, requestedDates, approvedDates,
  selectedDates, onSelect, onMonthChange,
}: CalendarProps) {
  const days = getDaysInMonth(year, month);
  const firstDayOffset = days[0]?.getDay() ?? 0;

  const toggleDate = useCallback((dateStr: string) => {
    if (blockedDates.has(dateStr)) return;
    onSelect(
      selectedDates.includes(dateStr)
        ? selectedDates.filter(d => d !== dateStr)
        : [...selectedDates, dateStr]
    );
  }, [selectedDates, blockedDates, onSelect]);

  const getCellClass = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) return 'bg-primary text-primary-foreground ring-2 ring-primary/50';
    if (approvedDates.has(dateStr)) return 'bg-success/20 text-success border border-success/30';
    if (requestedDates.has(dateStr)) return 'bg-warning/20 text-warning border border-warning/30';
    if (holidays[dateStr]) return 'bg-accent/15 text-accent border border-accent/30';
    if (blockedDates.has(dateStr)) return 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed';
    return 'hover:bg-secondary cursor-pointer text-foreground';
  };

  const handlePrev = () => {
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    onMonthChange?.(y, m);
  };
  const handleNext = () => {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    onMonthChange?.(y, m);
  };

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrev} className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-lg font-semibold tracking-heading">{monthLabel}</h3>
        <button onClick={handleNext} className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground tracking-label uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(day => {
          const ds = toDateStr(day);
          const isBlocked = blockedDates.has(ds);
          return (
            <motion.button
              key={ds}
              whileHover={isBlocked ? {} : { scale: 1.1 }}
              whileTap={isBlocked ? {} : { scale: 0.95 }}
              onClick={() => toggleDate(ds)}
              disabled={isBlocked}
              aria-label={`${day.getDate()} ${holidays[ds] ? '— ' + holidays[ds] : ''} ${isBlocked ? '(blocked)' : ''}`}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-colors ${getCellClass(ds)}`}
            >
              <span className="font-medium">{day.getDate()}</span>
              {holidays[ds] && <span className="text-[8px] leading-tight truncate w-full text-center">🎉</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-accent/15 border border-accent/30" /> Holiday</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted/50" /> Blocked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning/20 border border-warning/30" /> Requested</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/20 border border-success/30" /> Approved</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary" /> Selected</span>
      </div>
    </div>
  );
}
