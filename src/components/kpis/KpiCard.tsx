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
  primary: '0 0 50px hsla(354, 100%, 64%, 0.08), 0 8px 32px hsla(0,0%,0%,0.3)',
  accent: '0 0 50px hsla(35, 100%, 60%, 0.08), 0 8px 32px hsla(0,0%,0%,0.3)',
  success: '0 0 50px hsla(152, 69%, 42%, 0.08), 0 8px 32px hsla(0,0%,0%,0.3)',
  warning: '0 0 50px hsla(35, 100%, 60%, 0.08), 0 8px 32px hsla(0,0%,0%,0.3)',
  info: '0 0 50px hsla(215, 100%, 58%, 0.08), 0 8px 32px hsla(0,0%,0%,0.3)',
};
const borderAccentMap: Record<string, string> = {
  primary: 'hover:border-primary/25', accent: 'hover:border-accent/25', success: 'hover:border-success/25', warning: 'hover:border-warning/25', info: 'hover:border-info/25',
};
const glowOrbMap: Record<string, string> = {
  primary: 'hsla(354, 100%, 64%, 0.12)', accent: 'hsla(35, 100%, 60%, 0.12)', success: 'hsla(152, 69%, 42%, 0.12)', warning: 'hsla(35, 100%, 60%, 0.12)', info: 'hsla(215, 100%, 58%, 0.12)',
};

function MiniSparkline({ data, accent }: { data: number[]; accent: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-40 group-hover:opacity-90 transition-opacity duration-500">
      <defs>
        <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.5" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#spark-${accent})`} />
      <path d={pathD} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={c} className="group-hover:animate-pulse" />
    </svg>
  );
}

export default function KpiCard({ label, value, icon, accent = 'primary', trend, subtitle, sparkline }: KpiCardProps) {
  return (
    <motion.div
      {...cardHover}
      className={`relative bg-card/70 backdrop-blur-2xl border border-border/30 rounded-2xl p-6 flex flex-col gap-3 group transition-all duration-500 ${borderAccentMap[accent]} overflow-hidden`}
      style={{ boxShadow: glowMap[accent] }}
    >
      {/* Accent top bar */}
      <div className="absolute top-0 left-5 right-5 h-[2px] rounded-b-full opacity-50" style={{ background: `var(--gradient-accent-bar)` }} />
      {/* Glow orb */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle, ${glowOrbMap[accent]}, transparent 70%)` }} />

      <div className="flex items-center justify-between relative z-10">
        {icon && (
          <div className={`w-14 h-14 rounded-xl ${iconBgMap[accent]} flex items-center justify-center border border-current/5 group-hover:scale-110 transition-transform duration-300`}>
            <span className={`${iconColorMap[accent]} [&>svg]:!w-6 [&>svg]:!h-6`}>{icon}</span>
          </div>
        )}
        {trend && (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${trendColors[trend.direction]}`}>
            {trend.direction === 'up' && <TrendingUp size={11} />}
            {trend.direction === 'down' && <TrendingDown size={11} />}
            {trend.direction === 'neutral' && <Minus size={11} />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 relative z-10 mt-1">
        <div>
          <span className="text-3xl font-black tracking-heading text-foreground font-heading">{value}</span>
          {subtitle && <p className="text-[11px] text-muted-foreground/50 mt-1">{subtitle}</p>}
        </div>
        {sparkline && <MiniSparkline data={sparkline} accent={accent} />}
      </div>
      <span className="text-[11px] tracking-label uppercase text-muted-foreground/50 font-semibold font-heading relative z-10">{label}</span>
    </motion.div>
  );
}
