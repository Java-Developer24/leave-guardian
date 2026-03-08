import { motion } from 'framer-motion';

interface SectionHeaderProps {
  tag: string;
  title: string;
  highlight?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ tag, title, highlight, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 'auto' }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="overflow-hidden"
      >
        <div className="section-label">{tag}</div>
      </motion.div>
      <div className="flex items-center justify-between gap-4 flex-wrap mt-1">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-heading leading-tight font-heading">
            {title}{' '}
            {highlight && <span className="gradient-text">{highlight}</span>}
          </h1>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xl leading-relaxed">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
