interface SectionHeaderProps {
  tag: string;
  title: string;
  highlight?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ tag, title, highlight, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="section-label">{tag}</div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-heading leading-tight">
            {title}{' '}
            {highlight && <span className="gradient-text">{highlight}</span>}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
