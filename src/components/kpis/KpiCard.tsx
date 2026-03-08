import { motion } from 'framer-motion';
import { cardHover } from '@/styles/motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'info';
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  subtitle?: string;
}

const iconBgMap: Record<string, string> = {
  primary: 'bg-primary/15',
  accent: 'bg-accent/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  info: 'bg-info/15',
};

const iconColorMap: Record<string, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
};

const trendColors: Record<string, string> = {
  up: 'text-success bg-success/10',
  down: 'text-destructive bg-destructive/10',
  neutral: 'text-muted-foreground bg-muted/30',
};

export default function KpiCard({ label, value, icon, accent = 'primary', trend, subtitle }: KpiCardProps) {
  return (
    <motion.div
      {...cardHover}
      className="glass-card p-5 flex flex-col gap-3 group hover:border-primary/20 transition-colors duration-300"
    >
      <div className="flex items-start justify-between">
        {icon && (
          <div className={`kpi-icon ${iconBgMap[accent]}`}>
            <span className={iconColorMap[accent]}>{icon}</span>
          </div>
        )}
        {trend && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${trendColors[trend.direction]}`}>
            {trend.direction === 'up' && <TrendingUp size={12} />}
            {trend.direction === 'down' && <TrendingDown size={12} />}
            {trend.direction === 'neutral' && <Minus size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <span className="text-3xl font-extrabold tracking-heading text-foreground">{value}</span>
      </div>
      <div>
        <span className="text-xs tracking-label uppercase text-muted-foreground font-medium">{label}</span>
        {subtitle && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
