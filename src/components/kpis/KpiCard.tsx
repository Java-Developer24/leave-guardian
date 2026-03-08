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
  up: 'text-success bg-success/8 border-success/15',
  down: 'text-destructive bg-destructive/8 border-destructive/15',
  neutral: 'text-muted-foreground bg-muted/20 border-muted/20',
};
const glowMap: Record<string, string> = {
  primary: '0 0 30px hsla(354, 100%, 64%, 0.04), 0 2px 12px hsla(0,0%,0%,0.2)',
  accent: '0 0 30px hsla(35, 100%, 60%, 0.04), 0 2px 12px hsla(0,0%,0%,0.2)',
  success: '0 0 30px hsla(152, 69%, 42%, 0.04), 0 2px 12px hsla(0,0%,0%,0.2)',
  warning: '0 0 30px hsla(35, 100%, 60%, 0.04), 0 2px 12px hsla(0,0%,0%,0.2)',
  info: '0 0 30px hsla(215, 100%, 58%, 0.04), 0 2px 12px hsla(0,0%,0%,0.2)',
};
const borderAccentMap: Record<string, string> = {
  primary: 'hover:border-primary/15', accent: 'hover:border-accent/15', success: 'hover:border-success/15', warning: 'hover:border-warning/15', info: 'hover:border-info/15',
};

function MiniSparkline({ data, accent }: { data: number[]; accent: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60, h = 22;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const colorMap: Record<string, string> = {
    primary: 'hsl(354, 100%, 64%)', accent: 'hsl(35, 100%, 60%)', success: 'hsl(152, 69%, 42%)', warning: 'hsl(35, 100%, 60%)', info: 'hsl(215, 100%, 58%)',
  };
  const c = colorMap[accent] || colorMap.primary;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-40 group-hover:opacity-70 transition-opacity duration-500">
      <defs>
        <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#spark-${accent})`} />
      <path d={pathD} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={c} />
    </svg>
  );
}

export default function KpiCard({ label, value, icon, accent = 'primary', trend, subtitle, sparkline }: KpiCardProps) {
  return (
    <motion.div
      {...cardHover}
      className={`relative bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 flex flex-col gap-2 group transition-all duration-500 ${borderAccentMap[accent]} overflow-hidden`}
      style={{ boxShadow: glowMap[accent] }}
    >
      <div className="absolute top-0 left-3 right-3 h-[2px] rounded-b-full opacity-30" style={{ background: `var(--gradient-accent-bar)` }} />
      <div className="flex items-center justify-between relative z-10">
        {icon && (
          <div className={`w-9 h-9 rounded-lg ${iconBgMap[accent]} flex items-center justify-center border border-current/5 group-hover:scale-105 transition-transform duration-300`}>
            <span className={iconColorMap[accent]}>{icon}</span>
          </div>
        )}
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${trendColors[trend.direction]}`}>
            {trend.direction === 'up' && <TrendingUp size={9} />}
            {trend.direction === 'down' && <TrendingDown size={9} />}
            {trend.direction === 'neutral' && <Minus size={9} />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-1 relative z-10">
        <div>
          <span className="text-2xl font-black tracking-heading text-foreground font-heading">{value}</span>
          {subtitle && <p className="text-[10px] text-muted-foreground/50">{subtitle}</p>}
        </div>
        {sparkline && <MiniSparkline data={sparkline} accent={accent} />}
      </div>
      <span className="text-[9px] tracking-label uppercase text-muted-foreground/60 font-semibold font-heading relative z-10">{label}</span>
    </motion.div>
  );
}
