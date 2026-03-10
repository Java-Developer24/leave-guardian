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
  primary: 'bg-primary/10', accent: 'bg-accent/10', success: 'bg-success/10', warning: 'bg-warning/10', info: 'bg-info/10',
};
const iconColorMap: Record<string, string> = {
  primary: 'text-primary', accent: 'text-accent', success: 'text-success', warning: 'text-warning', info: 'text-info',
};
const trendColors: Record<string, string> = {
  up: 'text-success bg-success/8 border-success/20',
  down: 'text-destructive bg-destructive/8 border-destructive/20',
  neutral: 'text-muted-foreground bg-muted/30 border-muted/30',
};

function MiniSparkline({ data, accent }: { data: number[]; accent: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 70, h = 28;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const colorMap: Record<string, string> = {
    primary: 'hsl(356, 98%, 65%)', accent: 'hsl(37, 100%, 58%)', success: 'hsl(152, 69%, 42%)', warning: 'hsl(37, 100%, 58%)', info: 'hsl(215, 100%, 58%)',
  };
  const c = colorMap[accent] || colorMap.primary;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-50">
      <defs>
        <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#spark-${accent})`} />
      <path d={pathD} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={c} />
    </svg>
  );
}

export default function KpiCard({ label, value, icon, accent = 'primary', trend, subtitle, sparkline }: KpiCardProps) {
  return (
    <motion.div
      {...cardHover}
      className="relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-2.5 group transition-all duration-300 overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between">
        {icon && (
          <div className={`w-11 h-11 rounded-xl ${iconBgMap[accent]} flex items-center justify-center`}>
            <span className={`${iconColorMap[accent]}`}>{icon}</span>
          </div>
        )}
        {trend && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${trendColors[trend.direction]}`}>
            {trend.direction === 'up' && <TrendingUp size={10} />}
            {trend.direction === 'down' && <TrendingDown size={10} />}
            {trend.direction === 'neutral' && <Minus size={10} />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-extrabold tracking-heading text-foreground font-heading">{value}</span>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {sparkline && <MiniSparkline data={sparkline} accent={accent} />}
      </div>
      <span className="text-[10px] tracking-label uppercase text-muted-foreground font-medium font-heading">{label}</span>
    </motion.div>
  );
}