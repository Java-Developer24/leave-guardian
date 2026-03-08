import { motion } from 'framer-motion';
import { pageTransition } from '@/styles/motion';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <motion.div {...pageTransition}>
      <h1 className="text-2xl font-bold tracking-heading mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
          <BarChart3 size={48} className="text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-1">Planned vs Actual Leaves</h3>
          <p className="text-sm text-muted-foreground text-center">Chart placeholder — integrate Power BI or Recharts here</p>
          <div className="mt-6 w-full space-y-3">
            {[
              { label: 'Jan', planned: 65, actual: 70 },
              { label: 'Feb', planned: 55, actual: 60 },
              { label: 'Mar', planned: 70, actual: 45 },
            ].map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{d.label}</span>
                  <span>P:{d.planned}% A:{d.actual}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary/60 rounded-l-full" style={{ width: `${d.planned}%` }} />
                  <div className="h-full bg-accent/60" style={{ width: `${Math.max(0, d.actual - d.planned)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
          <BarChart3 size={48} className="text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-1">High-Risk Dates</h3>
          <p className="text-sm text-muted-foreground text-center">Chart placeholder — upcoming dates with shrinkage near cap</p>
          <div className="mt-6 w-full space-y-2">
            {['2026-03-15', '2026-03-22', '2026-04-02'].map(d => (
              <div key={d} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <span className="text-sm font-medium">{d}</span>
                <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">~{Math.floor(Math.random() * 5 + 7)}% shrinkage</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
