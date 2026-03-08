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
  sparkline?: number[];
}

const iconBgMap: Record<string, string> = {
  primary: 'bg-primary/12',
  accent: 'bg-accent/12',
  success: 'bg-success/12',
  warning: 'bg-warning/12',
  info: 'bg-info/12',
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

const glowMap: Record<string, string> = {
  primary: '0 0 30px hsla(356, 98%, 62%, 0.08)',
  accent: '0 0 30px hsla(37, 100%, 58%, 0.08)',
  success: '0 0 30px hsla(142, 76%, 36%, 0.08)',
  warning: '0 0 30px hsla(37, 100%, 58%, 0.08)',
  info: '0 0 30px hsla(210, 100%, 52%, 0.08)',
};

function MiniSparkline({ data, accent }: { data: number[]; accent: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const colorMap: Record<string, string> = {
    primary: 'hsl(356, 98%, 62%)',
    accent: 'hsl(37, 100%, 58%)',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(37, 100%, 58%)',
    info: 'hsl(210, 100%, 52%)',
  };
  const c = colorMap[accent] || colorMap.primary;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-40">
      <defs>
        <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#spark-${accent})`} />
      <path d={pathD} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KpiCard({ label, value, icon, accent = 'primary', trend, subtitle, sparkline }: KpiCardProps) {
  return (
    <motion.div
      {...cardHover}
      className="glass-card gradient-border p-5 flex flex-col gap-3 group"
      style={{ boxShadow: glowMap[accent] }}
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
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-extrabold tracking-heading text-foreground">{value}</span>
          {subtitle && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
        </div>
        {sparkline && <MiniSparkline data={sparkline} accent={accent} />}
      </div>
      <span className="text-[10px] tracking-label uppercase text-muted-foreground font-semibold">{label}</span>
    </motion.div>
  );
}
