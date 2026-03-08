import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [direction, setDirection] = useState(0);
  const days = getDaysInMonth(year, month);
  const firstDayOffset = days[0]?.getDay() ?? 0;
  const todayStr = toDateStr(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const toggleDate = useCallback((dateStr: string) => {
    if (blockedDates.has(dateStr)) return;
    onSelect(
      selectedDates.includes(dateStr)
        ? selectedDates.filter(d => d !== dateStr)
        : [...selectedDates, dateStr]
    );
  }, [selectedDates, blockedDates, onSelect]);

  const getCellClass = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) return 'bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-lg';
    if (approvedDates.has(dateStr)) return 'bg-success/15 text-success border border-success/25';
    if (requestedDates.has(dateStr)) return 'bg-warning/15 text-warning border border-warning/25';
    if (holidays[dateStr]) return 'bg-accent/10 text-accent border border-accent/20';
    if (blockedDates.has(dateStr)) return 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed';
    return 'hover:bg-secondary/80 cursor-pointer text-foreground hover:border-primary/20 border border-transparent';
  };

  const handlePrev = () => {
    setDirection(-1);
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    onMonthChange?.(y, m);
  };
  const handleNext = () => {
    setDirection(1);
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    onMonthChange?.(y, m);
  };

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <button onClick={handlePrev} className="p-2.5 rounded-xl hover:bg-secondary transition-all hover:scale-105" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-lg font-bold tracking-heading">{monthLabel}</h3>
        <button onClick={handleNext} className="p-2.5 rounded-xl hover:bg-secondary transition-all hover:scale-105" aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground tracking-label uppercase py-2">{d}</div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1.5"
        >
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const ds = toDateStr(day);
            const isBlocked = blockedDates.has(ds);
            const isToday = ds === todayStr;
            return (
              <motion.button
                key={ds}
                whileHover={isBlocked ? {} : { scale: 1.08 }}
                whileTap={isBlocked ? {} : { scale: 0.94 }}
                onClick={() => toggleDate(ds)}
                onMouseEnter={() => setHoveredDate(ds)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isBlocked}
                aria-label={`${day.getDate()} ${holidays[ds] ? '— ' + holidays[ds] : ''} ${isBlocked ? '(blocked)' : ''}`}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${getCellClass(ds)}`}
              >
                {isToday && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary shadow-lg" style={{ boxShadow: '0 0 8px hsla(356,98%,62%,0.5)' }} />
                )}
                <span className="font-semibold text-[13px]">{day.getDate()}</span>
                {holidays[ds] && <span className="text-[7px] leading-tight truncate w-full text-center mt-0.5">🎉</span>}
                {/* Tooltip */}
                {hoveredDate === ds && holidays[ds] && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border px-2 py-1 rounded-lg text-[10px] whitespace-nowrap z-10 shadow-lg font-medium pointer-events-none">
                    {holidays[ds]}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap gap-4 mt-5 text-[10px]">
        {[
          { label: 'Holiday', cls: 'bg-accent/10 border border-accent/20' },
          { label: 'Blocked', cls: 'bg-muted/30' },
          { label: 'Requested', cls: 'bg-warning/15 border border-warning/25' },
          { label: 'Approved', cls: 'bg-success/15 border border-success/25' },
          { label: 'Selected', cls: 'bg-primary' },
          { label: 'Today', cls: 'border-2 border-primary' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={`w-3 h-3 rounded ${l.cls}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
