import { motion } from 'framer-motion';
import { cardHover } from '@/styles/motion';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'info';
}

const accentMap: Record<string, string> = {
  primary: 'from-primary/20 to-primary/5',
  accent: 'from-accent/20 to-accent/5',
  success: 'from-success/20 to-success/5',
  warning: 'from-warning/20 to-warning/5',
  info: 'from-info/20 to-info/5',
};

const borderMap: Record<string, string> = {
  primary: 'border-primary/20',
  accent: 'border-accent/20',
  success: 'border-success/20',
  warning: 'border-warning/20',
  info: 'border-info/20',
};

export default function KpiCard({ label, value, icon, accent = 'primary' }: KpiCardProps) {
  return (
    <motion.div
      {...cardHover}
      className={`glass-card p-5 bg-gradient-to-br ${accentMap[accent]} border ${borderMap[accent]} flex flex-col gap-2`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-label uppercase text-muted-foreground font-medium">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className="text-3xl font-bold tracking-heading text-foreground">{value}</span>
    </motion.div>
  );
}
