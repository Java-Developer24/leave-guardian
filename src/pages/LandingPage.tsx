import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '@/styles/motion';
import {
  Calendar, BarChart3, Shield, Users, ArrowRight, CheckCircle,
  Zap, Globe, Clock, TrendingUp, Sparkles, ChevronRight
} from 'lucide-react';

const stats = [
  { value: '10K+', label: 'Leaves Managed', icon: Calendar },
  { value: '99.9%', label: 'Uptime', icon: Zap },
  { value: '500+', label: 'Active Teams', icon: Users },
  { value: '45%', label: 'Time Saved', icon: Clock },
];

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'Intelligent date blocking with real-time shrinkage calculations. Holidays, weekly offs, and capacity limits — all automated.',
    accent: 'primary' as const,
  },
  {
    icon: BarChart3,
    title: 'Shrinkage Analytics',
    description: 'Monitor planned vs actual shrinkage with department breakdowns, risk alerts, and trend predictions.',
    accent: 'accent' as const,
  },
  {
    icon: Shield,
    title: 'Role-Based Workflows',
    description: 'Purpose-built dashboards for agents, supervisors, and admins. Approval chains, swap requests, and instant status updates.',
    accent: 'info' as const,
  },
];

const roles = [
  {
    role: 'Agent',
    desc: 'Apply for leave, initiate swaps, track approval status, and manage your personal calendar.',
    items: ['Apply planned leave', 'Swap & transfer requests', 'Real-time quota tracking', 'Leave history timeline'],
    gradient: 'from-primary/20 to-primary/5',
  },
  {
    role: 'Supervisor',
    desc: 'Review pending approvals, monitor team shrinkage, and ensure coverage across shifts.',
    items: ['Approve/reject with context', 'Shrinkage impact preview', 'Team hours tracking', 'Risk date alerts'],
    gradient: 'from-accent/20 to-accent/5',
  },
  {
    role: 'Admin',
    desc: 'Upload schedules, configure policies, manage holidays, and access organization-wide analytics.',
    items: ['Schedule & attendance uploads', 'Leave window control', 'Shrinkage rule engine', 'Performance dashboards'],
    gradient: 'from-info/20 to-info/5',
  },
];

const featureIconBg: Record<string, string> = {
  primary: 'bg-primary/12',
  accent: 'bg-accent/12',
  info: 'bg-info/12',
};
const featureIconColor: Record<string, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  info: 'text-info',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background mesh-bg overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-lg font-extrabold gradient-text">L</span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-heading">LSM</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Leave & Shrinkage Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-16 pt-16 pb-24 lg:pt-28 lg:pb-36 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-8"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide">INTELLIGENT WORKFORCE MANAGEMENT</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-heading leading-[1.1]">
            Streamline{' '}
            <span className="gradient-text">Leave Planning</span>
            <br />
            & Shrinkage Control
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Empower your teams with intelligent leave scheduling, real-time shrinkage analytics, 
            and automated approval workflows — all in one premium platform.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold px-8 py-4 rounded-xl text-sm flex items-center gap-2.5 group">
              Launch Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="bg-secondary/60 border border-border text-foreground font-medium px-8 py-4 rounded-xl text-sm flex items-center gap-2 hover:bg-secondary transition-all">
              <Globe size={16} className="text-muted-foreground" />
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto -mt-8">
        <motion.div
          {...staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="glass-card-featured p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map(s => (
            <motion.div key={s.label} variants={staggerItem} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <s.icon size={18} className="text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold tracking-heading gradient-text">{s.value}</div>
              <div className="text-[10px] tracking-section uppercase text-muted-foreground mt-1 font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-16 py-24 lg:py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="section-label justify-center">CORE CAPABILITIES</div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-heading mt-3">
            Everything You Need to{' '}
            <span className="gradient-text">Manage Leaves</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Purpose-built tools for workforce management with real-time analytics and intelligent automation.
          </p>
        </motion.div>

        <motion.div
          {...staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map(f => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              className="glass-card-featured gradient-border p-8 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${featureIconBg[f.accent]} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={24} className={featureIconColor[f.accent]} />
              </div>
              <h3 className="text-xl font-bold tracking-heading mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Role Showcase */}
      <section className="relative z-10 px-6 lg:px-16 pb-24 lg:pb-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="section-label justify-center">ROLE-BASED ACCESS</div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-heading mt-3">
            Built for Every <span className="gradient-text">Role</span>
          </h2>
        </motion.div>

        <motion.div
          {...staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {roles.map(r => (
            <motion.div
              key={r.role}
              variants={staggerItem}
              className="glass-card p-7 flex flex-col"
            >
              <div className={`w-full h-2 rounded-full bg-gradient-to-r ${r.gradient} mb-6`} />
              <h3 className="text-xl font-bold tracking-heading mb-2">{r.role}</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{r.desc}</p>
              <ul className="space-y-2.5 mt-auto">
                {r.items.map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle size={14} className="text-success flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-16 pb-24 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-featured accent-top-card text-center p-10 md:p-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-heading">
            Ready to <span className="gradient-text">Transform</span> Your Workflow?
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Start managing leaves and shrinkage with data-driven precision.
          </p>
          <Link to="/login" className="btn-primary-gradient text-primary-foreground font-bold px-10 py-4 rounded-xl text-sm inline-flex items-center gap-2.5 mt-8 group">
            Get Started Now
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-6 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-extrabold gradient-text">L</span>
            </div>
            <span className="text-sm font-semibold tracking-heading">LSM</span>
            <span className="text-[10px] text-muted-foreground">v2.1</span>
          </div>
          <p className="text-[11px] text-muted-foreground/50">© 2026 Leave & Shrinkage Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
