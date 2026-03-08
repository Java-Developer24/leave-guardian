import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDaysInMonth, toDateStr } from '@/core/utils/dates';
import { ChevronLeft, ChevronRight, Sun, Star, CalendarDays } from 'lucide-react';

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

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  // Counts for the mini summary
  const holidayCount = days.filter(d => holidays[toDateStr(d)]).length;
  const blockedCount = days.filter(d => blockedDates.has(toDateStr(d))).length;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header with gradient accent */}
      <div className="relative px-7 pt-7 pb-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-info" />
        <div className="flex items-center justify-between">
          <button onClick={handlePrev} className="w-10 h-10 rounded-xl bg-secondary/40 hover:bg-secondary/70 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-border/20" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h3 className="text-xl font-black tracking-heading font-heading">{monthLabel}</h3>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                <Sun size={10} className="text-accent" /> {holidayCount} holidays
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                <CalendarDays size={10} className="text-destructive/60" /> {blockedCount} blocked
              </span>
            </div>
          </div>
          <button onClick={handleNext} className="w-10 h-10 rounded-xl bg-secondary/40 hover:bg-secondary/70 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-border/20" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 px-5 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className={`text-center text-[10px] font-bold tracking-wider uppercase py-2.5 font-heading ${i === 0 || i === 6 ? 'text-primary/40' : 'text-muted-foreground/40'}`}>
            <span className="hidden sm:inline">{WEEKDAY_FULL[i]}</span>
            <span className="sm:hidden">{d}</span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1.5 px-5 pb-5"
        >
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const ds = toDateStr(day);
            const isBlocked = blockedDates.has(ds);
            const isToday = ds === todayStr;
            const isSelected = selectedDates.includes(ds);
            const isApproved = approvedDates.has(ds);
            const isRequested = requestedDates.has(ds);
            const isHoliday = !!holidays[ds];
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            let cellClass = 'hover:bg-secondary/60 cursor-pointer text-foreground/80 hover:border-primary/20 border border-transparent';
            if (isSelected) cellClass = 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-2 ring-primary/30 shadow-lg shadow-primary/25 border border-primary/40';
            else if (isApproved) cellClass = 'bg-success/10 text-success border border-success/25 shadow-sm shadow-success/5';
            else if (isRequested) cellClass = 'bg-warning/10 text-warning border border-warning/25';
            else if (isHoliday) cellClass = 'bg-accent/8 text-accent border border-accent/20';
            else if (isBlocked) cellClass = 'bg-muted/15 text-muted-foreground/25 cursor-not-allowed border border-transparent';

            return (
              <motion.button
                key={ds}
                whileHover={isBlocked ? {} : { scale: 1.08, y: -2 }}
                whileTap={isBlocked ? {} : { scale: 0.92 }}
                onClick={() => toggleDate(ds)}
                onMouseEnter={() => setHoveredDate(ds)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isBlocked}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-200 ${cellClass}`}
              >
                {/* Today indicator - glowing ring */}
                {isToday && !isSelected && (
                  <span className="absolute inset-0 rounded-xl border-2 border-primary/50 pointer-events-none" style={{ boxShadow: '0 0 12px hsla(354,100%,64%,0.3), inset 0 0 12px hsla(354,100%,64%,0.1)' }} />
                )}
                {isToday && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" style={{ boxShadow: '0 0 8px hsla(354,100%,64%,0.7)' }} />
                )}

                <span className={`font-bold text-[13px] ${isWeekend && !isSelected && !isHoliday && !isApproved && !isRequested ? 'text-muted-foreground/40' : ''}`}>
                  {day.getDate()}
                </span>

                {/* Holiday star */}
                {isHoliday && !isSelected && (
                  <Star size={8} className="text-accent fill-accent mt-0.5" />
                )}

                {/* Status dots */}
                {(isApproved || isRequested) && !isSelected && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isApproved ? 'bg-success' : 'bg-warning'}`} />
                )}

                {/* Tooltip */}
                {hoveredDate === ds && holidays[ds] && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card/98 backdrop-blur-xl border border-border/50 px-3 py-1.5 rounded-xl text-[10px] whitespace-nowrap z-10 shadow-xl font-semibold pointer-events-none">
                    <span className="text-accent">★</span> {holidays[ds]}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="px-7 pb-6 pt-2 border-t border-border/15">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px]">
          {[
            { label: 'Today', cls: 'border-2 border-primary/50' },
            { label: 'Selected', cls: 'bg-gradient-to-r from-primary to-primary/80' },
            { label: 'Approved', cls: 'bg-success/15 border border-success/25' },
            { label: 'Requested', cls: 'bg-warning/15 border border-warning/25' },
            { label: 'Holiday', cls: 'bg-accent/10 border border-accent/20' },
            { label: 'Blocked', cls: 'bg-muted/20' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-2 text-muted-foreground/60">
              <span className={`w-3 h-3 rounded-md ${l.cls}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
