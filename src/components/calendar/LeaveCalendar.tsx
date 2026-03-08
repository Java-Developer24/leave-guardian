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
    if (selectedDates.includes(dateStr)) return 'bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-lg shadow-primary/20';
    if (approvedDates.has(dateStr)) return 'bg-success/12 text-success border border-success/20';
    if (requestedDates.has(dateStr)) return 'bg-warning/12 text-warning border border-warning/20';
    if (holidays[dateStr]) return 'bg-accent/8 text-accent border border-accent/15';
    if (blockedDates.has(dateStr)) return 'bg-muted/20 text-muted-foreground/30 cursor-not-allowed';
    return 'hover:bg-secondary/70 cursor-pointer text-foreground hover:border-primary/15 border border-transparent';
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
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handlePrev} className="p-2.5 rounded-2xl hover:bg-secondary/60 transition-all hover:scale-105 active:scale-95" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-lg font-bold tracking-heading font-heading">{monthLabel}</h3>
        <button onClick={handleNext} className="p-2.5 rounded-2xl hover:bg-secondary/60 transition-all hover:scale-105 active:scale-95" aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-3">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/60 tracking-label uppercase py-2 font-heading">{d}</div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-2"
        >
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const ds = toDateStr(day);
            const isBlocked = blockedDates.has(ds);
            const isToday = ds === todayStr;
            return (
              <motion.button
                key={ds}
                whileHover={isBlocked ? {} : { scale: 1.1 }}
                whileTap={isBlocked ? {} : { scale: 0.92 }}
                onClick={() => toggleDate(ds)}
                onMouseEnter={() => setHoveredDate(ds)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isBlocked}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm transition-all ${getCellClass(ds)}`}
              >
                {isToday && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary" style={{ boxShadow: '0 0 10px hsla(354,100%,64%,0.6)' }} />
                )}
                <span className="font-semibold text-[13px]">{day.getDate()}</span>
                {holidays[ds] && <span className="text-[7px] leading-tight truncate w-full text-center mt-0.5">🎉</span>}
                {hoveredDate === ds && holidays[ds] && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-lg border border-border/50 px-3 py-1.5 rounded-xl text-[10px] whitespace-nowrap z-10 shadow-xl font-medium pointer-events-none">
                    {holidays[ds]}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap gap-4 mt-6 text-[10px]">
        {[
          { label: 'Holiday', cls: 'bg-accent/10 border border-accent/15' },
          { label: 'Blocked', cls: 'bg-muted/20' },
          { label: 'Requested', cls: 'bg-warning/12 border border-warning/20' },
          { label: 'Approved', cls: 'bg-success/12 border border-success/20' },
          { label: 'Selected', cls: 'bg-primary' },
          { label: 'Today', cls: 'border-2 border-primary' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-2 text-muted-foreground">
            <span className={`w-3.5 h-3.5 rounded-lg ${l.cls}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
