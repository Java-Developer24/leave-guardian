import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '@/styles/motion';
import {
  Calendar, BarChart3, Shield, Users, ArrowRight, CheckCircle,
  Zap, Globe, Clock, TrendingUp, Sparkles, ChevronRight, Star,
  Layers, Activity, ArrowUpRight, Fingerprint
} from 'lucide-react';
import { useRef } from 'react';

const stats = [
  { value: '10K+', label: 'Leaves Managed', icon: Calendar },
  { value: '99.9%', label: 'Platform Uptime', icon: Zap },
  { value: '500+', label: 'Active Teams', icon: Users },
  { value: '45%', label: 'Time Saved', icon: Clock },
];

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar Engine',
    description: 'AI-powered date blocking with real-time shrinkage calculations. Holidays, weekly offs, capacity limits — all orchestrated automatically.',
    accent: 'primary' as const,
    metric: '3x faster',
    metricLabel: 'planning speed',
  },
  {
    icon: BarChart3,
    title: 'Shrinkage Analytics',
    description: 'Monitor planned vs actual shrinkage with department breakdowns, risk alerts, and predictive trend analysis.',
    accent: 'accent' as const,
    metric: '99.2%',
    metricLabel: 'accuracy rate',
  },
  {
    icon: Shield,
    title: 'Role-Based Workflows',
    description: 'Purpose-built dashboards for every role. Multi-level approvals, swap requests, and real-time status propagation.',
    accent: 'info' as const,
    metric: '60%',
    metricLabel: 'fewer escalations',
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

const testimonials = [
  { name: 'Sarah Chen', role: 'Operations Director', text: 'LSM reduced our leave management overhead by 60%. The shrinkage analytics alone are worth it.', rating: 5 },
  { name: 'James Okafor', role: 'Team Lead', text: 'The approval workflow is seamless. I can see shrinkage impact before approving — game changer.', rating: 5 },
  { name: 'Priya Mehta', role: 'HR Manager', text: 'Finally a tool that understands contact center dynamics. Setup took 30 minutes.', rating: 5 },
];

const featureIconBg: Record<string, string> = { primary: 'bg-primary/12', accent: 'bg-accent/12', info: 'bg-info/12' };
const featureIconColor: Record<string, string> = { primary: 'text-primary', accent: 'text-accent', info: 'text-info' };
const roleColorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/15', glow: 'shadow-[0_0_30px_hsla(354,100%,64%,0.08)]' },
  accent: { bg: 'bg-accent/8', text: 'text-accent', border: 'border-accent/15', glow: 'shadow-[0_0_30px_hsla(35,100%,60%,0.08)]' },
  info: { bg: 'bg-info/8', text: 'text-info', border: 'border-info/15', glow: 'shadow-[0_0_30px_hsla(215,100%,58%,0.08)]' },
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-background mesh-bg overflow-hidden">
      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-20 py-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/10" style={{ boxShadow: '0 0 30px hsla(354,100%,64%,0.1)' }}>
            <span className="text-lg font-extrabold gradient-text font-heading">L</span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-heading font-heading">LSM</span>
            <span className="hidden sm:inline text-[11px] text-muted-foreground ml-2.5 font-medium">Leave & Shrinkage Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2.5">
            Sign In
          </Link>
          <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-2xl flex items-center gap-2">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 px-6 lg:px-20 pt-20 pb-32 lg:pt-32 lg:pb-44 max-w-7xl mx-auto">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2.5 bg-primary/8 border border-primary/15 px-5 py-2 rounded-full mb-10"
          >
            <Sparkles size={14} className="text-primary animate-glow-breathe" />
            <span className="text-[11px] font-bold text-primary tracking-wider uppercase font-heading">Intelligent Workforce Management</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-heading leading-[1.05] font-heading"
          >
            Streamline{' '}
            <span className="gradient-text">Leave</span>
            <br />
            <span className="gradient-text">Planning</span> &{' '}
            <span className="text-foreground">Shrinkage</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base md:text-lg text-muted-foreground mt-8 max-w-2xl mx-auto leading-relaxed"
          >
            Empower your teams with intelligent leave scheduling, real-time shrinkage analytics, 
            and automated approval workflows — built for modern contact centers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold px-10 py-4 rounded-2xl text-sm flex items-center gap-3 group">
              Launch Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="bg-secondary/50 border border-border/60 text-foreground font-semibold px-10 py-4 rounded-2xl text-sm flex items-center gap-2.5 hover:bg-secondary/70 hover:border-border transition-all">
              <Globe size={16} className="text-muted-foreground" />
              Explore Features
            </a>
          </motion.div>
        </motion.div>

        {/* Decorative orbs */}
        <div className="glow-orb w-80 h-80 bg-primary/6 top-10 left-0 animate-float" />
        <div className="glow-orb w-96 h-96 bg-accent/5 bottom-10 right-0 animate-float-delayed" />
        <div className="glow-orb w-64 h-64 bg-info/4 top-1/2 left-1/2 -translate-x-1/2 animate-float-slow" />
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 px-6 lg:px-20 max-w-6xl mx-auto -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="glass-card-featured p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <s.icon size={20} className="text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold tracking-heading gradient-text font-heading">{s.value}</div>
              <div className="text-[10px] tracking-section uppercase text-muted-foreground mt-2 font-semibold font-heading">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-20 py-28 lg:py-36 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="section-label justify-center">Core Capabilities</div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-heading mt-4 font-heading">
            Everything You Need to{' '}
            <span className="gradient-text">Manage Leaves</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-base leading-relaxed">
            Purpose-built tools with real-time analytics and intelligent automation for enterprise workforce management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              className="glass-card-featured gradient-border p-8 lg:p-10 group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl ${featureIconBg[f.accent]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={28} className={featureIconColor[f.accent]} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-extrabold font-heading ${featureIconColor[f.accent]}`}>{f.metric}</div>
                  <div className="text-[9px] tracking-section uppercase text-muted-foreground font-semibold">{f.metricLabel}</div>
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-heading mb-3 font-heading">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role Showcase */}
      <section className="relative z-10 px-6 lg:px-20 pb-28 lg:pb-36 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="section-label justify-center">Role-Based Access</div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-heading mt-4 font-heading">
            Built for Every <span className="gradient-text">Role</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-lg mx-auto text-base">
            Tailored experiences for agents, supervisors, and administrators.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {roles.map((r, i) => {
            const colors = roleColorMap[r.color];
            return (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`glass-card p-8 flex flex-col border ${colors.border} ${colors.glow}`}
              >
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-6`}>
                  <r.icon size={24} className={colors.text} />
                </div>
                <h3 className="text-2xl font-bold tracking-heading mb-2 font-heading">{r.role}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{r.desc}</p>
                <ul className="space-y-3 mt-auto">
                  {r.items.map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={15} className="text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 lg:px-20 pb-28 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="section-label justify-center">What Teams Say</div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-heading mt-4 font-heading">
            Trusted by <span className="gradient-text">Leaders</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-card p-7"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="text-accent fill-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{t.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-20 pb-28 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-featured accent-top-card text-center p-12 md:p-20 relative overflow-hidden"
        >
          <div className="glow-orb w-48 h-48 bg-primary/10 -top-20 -right-20" />
          <div className="glow-orb w-36 h-36 bg-accent/8 -bottom-16 -left-16" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-heading font-heading">
              Ready to <span className="gradient-text">Transform</span>
              <br />Your Workflow?
            </h2>
            <p className="text-muted-foreground mt-5 max-w-lg mx-auto text-base">
              Start managing leaves and shrinkage with data-driven precision. No credit card required.
            </p>
            <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold px-12 py-4 rounded-2xl text-sm inline-flex items-center gap-3 mt-10 group">
              Get Started Free
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 px-6 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-extrabold gradient-text font-heading">L</span>
            </div>
            <span className="text-sm font-bold tracking-heading font-heading">LSM</span>
            <span className="text-[10px] text-muted-foreground/50 font-medium">v2.1</span>
          </div>
          <p className="text-[11px] text-muted-foreground/40">© 2026 Leave & Shrinkage Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
