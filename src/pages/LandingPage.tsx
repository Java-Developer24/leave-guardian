import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, BarChart3, Shield, Users, ArrowRight, CheckCircle,
  Zap, Globe, Clock, TrendingUp, Sparkles, Star,
  Layers, Activity, ArrowUpRight, Fingerprint, ChevronRight,
  LineChart, Bell, Lock, Workflow, Database, Eye
} from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

/* ─── Animated counter ─── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Animated grid background ─── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(225,12%,30%,0.15) 1px, transparent 0)',
        backgroundSize: '48px 48px',
      }} />
      {/* Gradient overlays */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-float" style={{ background: 'radial-gradient(circle, hsla(354,100%,64%,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] animate-float-delayed" style={{ background: 'radial-gradient(circle, hsla(35,100%,60%,0.06) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px] animate-float-slow" style={{ background: 'radial-gradient(circle, hsla(215,100%,58%,0.04) 0%, transparent 70%)' }} />
      {/* Animated lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-lines" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-lines)" />
      </svg>
    </div>
  );
}

/* ─── 3D tilt card ─── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
  };
  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={`transition-transform duration-300 ease-out ${className}`}>
      {children}
    </div>
  );
}

const stats = [
  { value: 10000, suffix: '+', label: 'Leaves Managed', icon: Calendar },
  { value: 99, suffix: '.9%', label: 'Platform Uptime', icon: Zap },
  { value: 500, suffix: '+', label: 'Active Teams', icon: Users },
  { value: 45, suffix: '%', label: 'Time Saved', icon: Clock },
];

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar Engine',
    description: 'AI-powered date blocking with real-time shrinkage calculations. Holidays, weekly offs, and capacity limits — all orchestrated automatically.',
    accent: 'primary' as const,
    metric: '3x faster',
    metricLabel: 'planning speed',
    items: ['Auto-block high-shrinkage dates', 'Monthly cap enforcement', 'Holiday-aware scheduling'],
  },
  {
    icon: BarChart3,
    title: 'Shrinkage Analytics',
    description: 'Monitor planned vs actual shrinkage with department breakdowns, risk alerts, and predictive trend analysis.',
    accent: 'accent' as const,
    metric: '99.2%',
    metricLabel: 'accuracy rate',
    items: ['Real-time dashboards', 'Department breakdowns', 'Predictive risk alerts'],
  },
  {
    icon: Shield,
    title: 'Role-Based Workflows',
    description: 'Purpose-built dashboards for every role. Multi-level approvals, swap requests, and real-time status propagation.',
    accent: 'info' as const,
    metric: '60%',
    metricLabel: 'fewer escalations',
    items: ['Agent / Supervisor / Admin views', 'Multi-level approval chains', 'Swap & transfer handling'],
  },
];

const roles = [
  {
    role: 'Agent',
    desc: 'Apply for leave, initiate swaps, track approval status, and manage your personal calendar with quota tracking.',
    items: ['Apply planned leave', 'Swap & transfer requests', 'Real-time quota ring', 'Leave history timeline'],
    color: 'primary',
    icon: Fingerprint,
  },
  {
    role: 'Supervisor',
    desc: 'Review pending approvals, monitor team shrinkage impact, and ensure coverage across all shifts.',
    items: ['One-click approve/reject', 'Shrinkage impact gauge', 'Team hours dashboard', 'Risk date alerts'],
    color: 'accent',
    icon: Activity,
  },
  {
    role: 'Admin',
    desc: 'Upload schedules, configure policies, manage holidays, and access organization-wide performance analytics.',
    items: ['Bulk schedule uploads', 'Leave window control', 'Shrinkage rule engine', 'Department analytics'],
    color: 'info',
    icon: Layers,
  },
];

const capabilities = [
  { icon: LineChart, title: 'Live Analytics', desc: 'Real-time shrinkage monitoring with predictive alerts' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Instant status updates across all approval stages' },
  { icon: Lock, title: 'Enterprise Security', desc: 'Role-based access control with audit logging' },
  { icon: Workflow, title: 'Automated Workflows', desc: 'Multi-level approvals with zero manual overhead' },
  { icon: Database, title: 'Data Integration', desc: 'CSV/JSON imports for schedules and attendance' },
  { icon: Eye, title: 'Full Visibility', desc: 'Organization-wide dashboards for every stakeholder' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Operations Director', text: 'LSM reduced our leave management overhead by 60%. The shrinkage analytics alone are worth it.', rating: 5, company: 'TechServe Inc.' },
  { name: 'James Okafor', role: 'Team Lead', text: 'The approval workflow is seamless. I can see shrinkage impact before approving — game changer.', rating: 5, company: 'GlobalConnect' },
  { name: 'Priya Mehta', role: 'HR Manager', text: 'Finally a tool that understands contact center dynamics. Setup took 30 minutes.', rating: 5, company: 'VoiceFirst' },
];

const featureAccentMap: Record<string, { iconBg: string; iconColor: string; metricColor: string; borderGlow: string }> = {
  primary: { iconBg: 'bg-primary/10', iconColor: 'text-primary', metricColor: 'text-primary', borderGlow: 'hover:border-primary/20 hover:shadow-[0_0_60px_hsla(354,100%,64%,0.08)]' },
  accent: { iconBg: 'bg-accent/10', iconColor: 'text-accent', metricColor: 'text-accent', borderGlow: 'hover:border-accent/20 hover:shadow-[0_0_60px_hsla(35,100%,60%,0.08)]' },
  info: { iconBg: 'bg-info/10', iconColor: 'text-info', metricColor: 'text-info', borderGlow: 'hover:border-info/20 hover:shadow-[0_0_60px_hsla(215,100%,58%,0.08)]' },
};

const roleAccentMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/15', glow: 'hover:shadow-[0_20px_60px_hsla(354,100%,64%,0.1)]' },
  accent: { bg: 'bg-accent/8', text: 'text-accent', border: 'border-accent/15', glow: 'hover:shadow-[0_20px_60px_hsla(35,100%,60%,0.1)]' },
  info: { bg: 'bg-info/8', text: 'text-info', border: 'border-info/15', glow: 'hover:shadow-[0_20px_60px_hsla(215,100%,58%,0.1)]' },
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <GridBackground />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-16 xl:px-24 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/15 flex items-center justify-center border border-primary/15 relative" style={{ boxShadow: '0 0 40px hsla(354,100%,64%,0.12)' }}>
            <span className="text-xl font-black gradient-text font-heading">L</span>
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <span className="text-xl font-black tracking-heading font-heading">LSM</span>
            <span className="hidden sm:inline text-[11px] text-muted-foreground/60 ml-3 font-medium tracking-wide">Leave & Shrinkage Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-5 py-2.5 rounded-xl hover:bg-secondary/40">
            Sign In
          </Link>
          <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold text-sm px-7 py-3 rounded-2xl flex items-center gap-2 group">
            Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 px-6 lg:px-16 xl:px-24 pt-10 pb-24 lg:pt-16 lg:pb-32 max-w-[1400px] mx-auto">
        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 px-6 py-2.5 rounded-full mb-12 backdrop-blur-sm"
          >
            <Sparkles size={14} className="text-primary animate-glow-breathe" />
            <span className="text-[11px] font-bold text-primary tracking-wider uppercase font-heading">Intelligent Workforce Management</span>
            <ChevronRight size={12} className="text-primary/50" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[3.5rem] md:text-7xl lg:text-8xl xl:text-[6.5rem] font-black tracking-[-0.04em] leading-[0.95] font-heading"
          >
            Streamline{' '}
            <span className="gradient-text">Leave</span>
            <br className="hidden md:block" />
            <span className="gradient-text"> Planning</span> &{' '}
            <br className="hidden lg:block" />
            <span className="text-foreground/90">Shrinkage</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground/80 mt-8 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Empower your teams with intelligent leave scheduling, real-time shrinkage analytics, 
            and automated approval workflows — built for modern contact centers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14"
          >
            <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold px-10 py-3.5 rounded-2xl text-sm flex items-center gap-2.5 group shadow-2xl shadow-primary/25">
              Launch Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="bg-card/60 backdrop-blur-xl border border-border/60 text-foreground font-semibold px-8 py-3 rounded-2xl text-sm flex items-center gap-2 hover:bg-card/80 hover:border-border transition-all group">
              <Globe size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              Explore Features
            </a>
          </motion.div>

          {/* Hero visual badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-20 inline-flex items-center gap-6 bg-card/40 backdrop-blur-xl border border-border/30 rounded-full px-8 py-3"
          >
            <div className="flex -space-x-3">
              {['SC', 'JO', 'PM', 'AK'].map((initials, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border-2 border-background flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">{initials}</span>
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Trusted by 500+ teams</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className="text-accent fill-accent" />)}
                <span className="text-[11px] text-muted-foreground ml-1">4.9/5</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 lg:px-16 xl:px-24 max-w-6xl mx-auto -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Glowing border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/10 to-info/15 p-[1px]">
            <div className="w-full h-full rounded-3xl bg-card/95 backdrop-blur-2xl" />
          </div>
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 p-10 md:p-14">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary/12 transition-all duration-300 border border-primary/10">
                  <s.icon size={22} className="text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-black tracking-heading gradient-text font-heading">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-2.5 font-semibold font-heading">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-16 xl:px-24 py-32 lg:py-40 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="section-label justify-center">Core Capabilities</div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-heading mt-5 font-heading leading-tight">
            Everything You Need to{' '}
            <br className="hidden md:block" />
            <span className="gradient-text">Manage Leaves</span>
          </h2>
          <p className="text-muted-foreground/70 mt-6 max-w-xl mx-auto text-lg leading-relaxed">
            Purpose-built tools with real-time analytics and intelligent automation for enterprise workforce management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f, i) => {
            const a = featureAccentMap[f.accent];
            return (
              <TiltCard key={f.title}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className={`relative h-full bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl p-8 lg:p-10 group transition-all duration-500 ${a.borderGlow}`}
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent to-transparent group-hover:from-primary/[0.02] group-hover:to-accent/[0.01] transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className={`w-16 h-16 rounded-2xl ${a.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-current/5`}>
                        <f.icon size={28} className={a.iconColor} />
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-black font-heading ${a.metricColor}`}>{f.metric}</div>
                        <div className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50 font-semibold">{f.metricLabel}</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold tracking-heading mb-3 font-heading">{f.title}</h3>
                    <p className="text-sm text-muted-foreground/70 leading-relaxed mb-6">{f.description}</p>
                    <div className="space-y-2.5">
                      {f.items.map(item => (
                        <div key={item} className="flex items-center gap-2.5 text-[13px] text-muted-foreground/60">
                          <CheckCircle size={14} className={`flex-shrink-0 ${a.iconColor}`} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="relative z-10 px-6 lg:px-16 xl:px-24 pb-32 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="section-label justify-center">Platform Features</div>
          <h2 className="text-3xl md:text-4xl font-black tracking-heading mt-4 font-heading">
            Built for <span className="gradient-text">Enterprise Scale</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="group flex items-start gap-4 p-6 rounded-2xl border border-transparent hover:border-border/40 hover:bg-card/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/12 group-hover:scale-105 transition-all border border-primary/8">
                <c.icon size={20} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-heading mb-1">{c.title}</h4>
                <p className="text-[13px] text-muted-foreground/60 leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role Showcase */}
      <section className="relative z-10 px-6 lg:px-16 xl:px-24 pb-32 lg:pb-40 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="section-label justify-center">Role-Based Access</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-heading mt-5 font-heading">
            Built for Every <span className="gradient-text">Role</span>
          </h2>
          <p className="text-muted-foreground/60 mt-5 max-w-lg mx-auto text-lg">
            Tailored experiences for agents, supervisors, and administrators.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {roles.map((r, i) => {
            const colors = roleAccentMap[r.color];
            return (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className={`relative bg-card/50 backdrop-blur-xl p-8 lg:p-10 flex flex-col border ${colors.border} rounded-3xl transition-all duration-500 ${colors.glow} hover:translate-y-[-4px]`}
              >
                <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center mb-7 border border-current/5`}>
                  <r.icon size={28} className={colors.text} />
                </div>
                <h3 className="text-2xl font-black tracking-heading mb-3 font-heading">{r.role}</h3>
                <p className="text-sm text-muted-foreground/60 mb-8 leading-relaxed">{r.desc}</p>
                <ul className="space-y-3.5 mt-auto">
                  {r.items.map(item => (
                    <li key={item} className="flex items-center gap-3 text-[13px]">
                      <CheckCircle size={15} className="text-success/70 flex-shrink-0" />
                      <span className="text-muted-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 lg:px-16 xl:px-24 pb-32 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="section-label justify-center">What Teams Say</div>
          <h2 className="text-3xl md:text-4xl font-black tracking-heading mt-4 font-heading">
            Trusted by <span className="gradient-text">Leaders</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="bg-card/40 backdrop-blur-xl border border-border/30 rounded-3xl p-8 hover:border-border/50 hover:bg-card/60 transition-all duration-300 group"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="text-accent fill-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground/70 leading-relaxed mb-7 italic">"{t.text}"</p>
              <div className="flex items-center gap-3.5 pt-5 border-t border-border/20">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center border border-primary/10">
                  <span className="text-xs font-bold text-primary">{t.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground/50">{t.role} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-16 xl:px-24 pb-32 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/15 to-info/20 p-[1px]">
            <div className="w-full h-full rounded-3xl bg-card/95 backdrop-blur-2xl" />
          </div>
          <div className="relative text-center p-14 md:p-24">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-info" />
            <div className="glow-orb w-56 h-56 bg-primary/10 -top-28 -right-28" />
            <div className="glow-orb w-40 h-40 bg-accent/8 -bottom-20 -left-20" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-heading font-heading leading-tight">
                Ready to <span className="gradient-text">Transform</span>
                <br />Your Workflow?
              </h2>
              <p className="text-muted-foreground/60 mt-6 max-w-lg mx-auto text-lg">
                Start managing leaves and shrinkage with data-driven precision. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold px-14 py-5 rounded-2xl text-base inline-flex items-center gap-3 group shadow-2xl shadow-primary/25">
                  Get Started Free
                  <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-6 py-4">
                  <TrendingUp size={16} /> View Live Demo
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 px-6 lg:px-16 xl:px-24 py-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center border border-primary/10">
              <span className="text-sm font-black gradient-text font-heading">L</span>
            </div>
            <div>
              <span className="text-sm font-bold font-heading">LSM</span>
              <span className="text-[10px] text-muted-foreground/40 ml-2">Leave & Shrinkage Manager</span>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[12px] text-muted-foreground/40">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Documentation</span>
          </div>
          <span className="text-[11px] text-muted-foreground/25">© 2026 LSM · All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
