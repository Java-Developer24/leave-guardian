import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, animate } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { seedUsers, seedDepartments } from '@/data/seeds';
import {
  ArrowRight, Shield, Lock, Fingerprint, Users, Layers,
  TrendingUp, CalendarCheck, BarChart3, Clock4, CheckCircle2,
  Zap, Activity
} from 'lucide-react';

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, to, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v) + suffix; },
    });
    return ctrl.stop;
  }, [inView, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

// ─── Feature pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon: Icon, label, delay }: { icon: React.ElementType; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06]
                 bg-white/[0.03] backdrop-blur-sm"
    >
      <Icon size={11} className="text-primary/70 shrink-0" />
      <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">{label}</span>
    </motion.div>
  );
}

const statCards = [
  { value: 103, suffix: '', label: 'Agents', icon: Users },
  { value: 11,  suffix: '', label: 'Departments', icon: Layers },
  { value: 99,  suffix: '%', label: 'Uptime', icon: TrendingUp },
];

const features = [
  { icon: CalendarCheck, label: 'Smart leave scheduling' },
  { icon: BarChart3,    label: 'Real-time shrinkage analytics' },
  { icon: Clock4,       label: 'Shift coverage forecasting' },
  { icon: CheckCircle2, label: 'Automated approval workflows' },
];

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const login = useAppStore(s => s.login);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await login(selectedUser);
      const user = seedUsers.find(u => u.id === selectedUser);
      navigate(ROLE_ROUTES[user?.role ?? 'agent']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-background relative overflow-hidden">

      {/* ── Global background ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(225,12%,30%,0.06) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-float"
          style={{ background: 'radial-gradient(circle, hsla(354,100%,64%,0.06) 0%, transparent 60%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] animate-float-delayed"
          style={{ background: 'radial-gradient(circle, hsla(35,100%,60%,0.04) 0%, transparent 60%)' }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL — redesigned
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 flex-col relative overflow-hidden">

        {/* Seamless right-edge fade — no hard line between panels */}
        <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent 0%, hsl(var(--background)) 100%)' }} />
        <div className="absolute top-[30%] right-[-60px] w-[200px] h-[200px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, hsla(354,100%,64%,0.08) 0%, transparent 70%)' }} />

        {/* Large decorative number — editorial accent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute top-6 right-8 text-[11rem] font-black leading-none select-none pointer-events-none"
          style={{
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(180deg, hsla(354,100%,64%,0.07) 0%, transparent 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.06em',
          }}
        >
          LSM
        </motion.div>

        {/* Main content */}
        <div className="flex flex-col justify-between h-full px-12 xl:px-16 py-14 relative z-10">

          {/* Top — logo wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px hsla(354,100%,64%,0.15)' }}>
              <Activity size={13} className="text-primary/80" />
            </div>
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted-foreground/40 font-heading">
              Workforce · Suite
            </span>
          </motion.div>

          {/* Middle — headline block */}
          <div className="max-w-[420px]">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex items-center gap-2 mb-5"
            >
              <div className="h-px w-6 bg-primary/40" />
              <span className="text-[10px] tracking-[0.22em] uppercase text-primary/60 font-bold font-heading">
                Leave & Shrinkage
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading font-black leading-[1.0] tracking-[-0.045em] mb-6"
              style={{ fontSize: 'clamp(2.4rem, 4vw, 3.4rem)' }}
            >
              Smarter
              <br />
              <span className="gradient-text">workforce</span>
              <br />
              decisions.
            </motion.h1>

            {/* Descriptor */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-[13px] text-muted-foreground/45 leading-relaxed max-w-[310px] mb-8"
            >
              Purpose-built for contact centers — plan leave, track shrinkage,
              and keep coverage right, without the spreadsheets.
            </motion.p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {features.map((f, i) => (
                <FeaturePill key={f.label} icon={f.icon} label={f.label} delay={0.55 + i * 0.08} />
              ))}
            </div>
          </div>

          {/* Bottom — stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Divider with live indicator */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-[9px] tracking-[0.14em] uppercase text-emerald-400/60 font-bold font-heading">
                  Live System
                </span>
              </div>
              <div className="flex-1 h-px bg-border/10" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group rounded-2xl border border-white/[0.05] bg-white/[0.02]
                             backdrop-blur-sm px-4 py-4 overflow-hidden"
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                  <s.icon size={14} className="text-muted-foreground/20 mb-2.5" />

                  <div className="text-2xl font-black gradient-text font-heading leading-none tracking-[-0.04em]">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[9px] tracking-[0.13em] uppercase text-muted-foreground/30 font-heading mt-1.5">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — login form (unchanged logic, minor polish)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative"
        >
          <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-br from-primary/15 via-accent/10 to-info/8 opacity-50 blur-sm" />

          <div className="relative bg-surface/90 backdrop-blur-3xl rounded-[22px] p-7 border border-border/25">
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-primary via-accent to-info rounded-b-full" />

            {/* Logo */}
            <div className="text-center mb-6 mt-1">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-accent/8 border border-primary/12 flex items-center justify-center mx-auto mb-3"
                style={{ boxShadow: '0 0 40px hsla(354,100%,64%,0.1)' }}
              >
                <span className="text-2xl font-black gradient-text font-heading">L</span>
              </motion.div>
              <h2 className="text-lg font-black tracking-heading font-heading">Welcome Back</h2>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">Select your account to continue</p>
            </div>

            {/* Quick role buttons */}
            <div className="flex gap-1.5 mb-4">
              {[
                { role: 'admin',      label: 'Admin',      icon: Shield, color: 'from-primary/10 to-primary/4 border-primary/12 text-primary' },
                { role: 'supervisor', label: 'Supervisor', icon: Users,  color: 'from-accent/10 to-accent/4 border-accent/12 text-accent' },
                { role: 'agent',      label: 'Agent',      icon: Zap,    color: 'from-info/10 to-info/4 border-info/12 text-info' },
              ].map(r => (
                <button
                  key={r.role}
                  onMouseEnter={() => setHoveredRole(r.role)}
                  onMouseLeave={() => setHoveredRole(null)}
                  onClick={() => { const first = seedUsers.find(u => u.role === r.role); if (first) setSelectedUser(first.id); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-gradient-to-b ${r.color} border transition-all duration-200 ${hoveredRole === r.role ? 'scale-[1.03] shadow-md' : ''}`}
                >
                  <r.icon size={14} />
                  <span className="text-[9px] font-bold">{r.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] tracking-label uppercase text-muted-foreground/50 mb-1.5 font-semibold font-heading">
                  User Account
                </label>
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="glass-input py-2.5 text-xs"
                >
                  <option value="">Choose a user…</option>
                  <optgroup label="👤 Admins">
                    {seedUsers.filter(u => u.role === 'admin').map(u =>
                      <option key={u.id} value={u.id}>{u.name} — Admin</option>
                    )}
                  </optgroup>
                  <optgroup label="👥 Supervisors">
                    {seedUsers.filter(u => u.role === 'supervisor').map(u => {
                      const dept = seedDepartments.find(d => d.id === u.departmentId);
                      return <option key={u.id} value={u.id}>{u.name} — {dept?.name ?? 'Supervisor'}</option>;
                    })}
                  </optgroup>
                  <optgroup label="🧑‍💼 Agents (sample)">
                    {seedUsers.filter(u => u.role === 'agent').filter((_, i) => i % 10 === 0).map(u => {
                      const dept = seedDepartments.find(d => d.id === u.departmentId);
                      return <option key={u.id} value={u.id}>{u.name} — {dept?.name ?? 'Agent'}</option>;
                    })}
                  </optgroup>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[9px] tracking-label uppercase text-muted-foreground/50 font-semibold font-heading">Password</label>
                  <span className="text-[10px] text-primary/50 font-medium cursor-pointer hover:text-primary transition-colors">Forgot?</span>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                  <input type="password" placeholder="Enter password" className="glass-input pl-9 py-2.5 text-xs" defaultValue="prototype" readOnly />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={!selectedUser || loading}
                className="w-full btn-primary-gradient text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-sm mt-1"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight size={15} /></>
                }
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/20" />
                <span className="text-[9px] text-muted-foreground/20 uppercase tracking-wider font-heading">or</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>

              <button className="w-full bg-card/50 border border-border/30 text-foreground/60 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-card/70 hover:border-border/40 transition-all">
                <Fingerprint size={14} className="text-muted-foreground/40" /> Sign in with SSO
              </button>

              <p className="text-center text-[10px] text-muted-foreground/30">
                No account?{' '}
                <span className="text-primary/50 font-semibold cursor-pointer hover:text-primary transition-colors">Contact Admin</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}