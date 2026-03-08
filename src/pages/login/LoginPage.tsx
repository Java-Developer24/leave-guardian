import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { seedUsers, seedDepartments } from '@/data/seeds';
import { ArrowRight, Shield, Calendar, BarChart3, Mail, Lock, Sparkles, CheckCircle, Fingerprint, Zap, Users, Activity, Globe, Layers, TrendingUp } from 'lucide-react';

const features = [
  { icon: Calendar, label: 'Smart leave planning with automated window control', color: 'text-primary' },
  { icon: BarChart3, label: 'Real-time shrinkage analytics & trend forecasting', color: 'text-accent' },
  { icon: Shield, label: 'Role-based access with multi-level approval chains', color: 'text-info' },
  { icon: CheckCircle, label: 'Swap & transfer workflows with peer acceptance', color: 'text-success' },
  { icon: Zap, label: 'Instant notifications and live status updates', color: 'text-warning' },
];

const statCards = [
  { value: '103', label: 'Active Agents', icon: Users },
  { value: '11', label: 'Departments', icon: Layers },
  { value: '99.9%', label: 'Uptime', icon: TrendingUp },
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
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(225,12%,30%,0.08) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[150px] animate-float" style={{ background: 'radial-gradient(circle, hsla(354,100%,64%,0.08) 0%, transparent 60%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[130px] animate-float-delayed" style={{ background: 'radial-gradient(circle, hsla(35,100%,60%,0.06) 0%, transparent 60%)' }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] animate-float-slow" style={{ background: 'radial-gradient(circle, hsla(215,100%,58%,0.04) 0%, transparent 60%)' }} />
      </div>

      {/* Left — Info Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-14 xl:px-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/15 px-5 py-2.5 rounded-full mb-10 backdrop-blur-sm"
          >
            <Sparkles size={13} className="text-primary animate-glow-breathe" />
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-heading">Enterprise Portal</span>
          </motion.div>

          <h1 className="text-5xl xl:text-[3.5rem] font-black tracking-[-0.04em] leading-[1.05] font-heading">
            Leave &<br />
            <span className="gradient-text">Shrinkage</span>
            <br />Manager
          </h1>
          <p className="text-muted-foreground/60 text-[15px] max-w-md mt-7 leading-relaxed">
            Workforce management for modern contact centers. Track shrinkage, manage approvals, and optimize staffing across all departments.
          </p>

          <div className="mt-12 space-y-3.5">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-card/80 flex items-center justify-center flex-shrink-0 group-hover:bg-card border border-border/30 group-hover:border-border/50 group-hover:scale-105 transition-all duration-300">
                  <f.icon size={17} className={f.color} />
                </div>
                <span className="text-sm text-muted-foreground/50 group-hover:text-muted-foreground transition-colors duration-300">{f.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex items-center gap-10 mt-14 pt-8 border-t border-border/15"
          >
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-black gradient-text font-heading">{s.value}</div>
                <div className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground/35 font-heading mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right — Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] relative"
        >
          {/* Outer glow */}
          <div className="absolute -inset-[2px] rounded-[28px] bg-gradient-to-br from-primary/25 via-accent/15 to-info/10 opacity-60 blur-sm" />
          <div className="absolute -inset-[1px] rounded-[27px] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent opacity-60" />

          <div className="relative bg-card/96 backdrop-blur-3xl rounded-[26px] p-10 border border-border/30">
            {/* Accent bar */}
            <div className="absolute top-0 left-10 right-10 h-[3px] bg-gradient-to-r from-primary via-accent to-info rounded-b-full" />

            {/* Logo */}
            <div className="text-center mb-10 mt-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-[76px] h-[76px] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15 flex items-center justify-center mx-auto mb-5 relative"
                style={{ boxShadow: '0 0 60px hsla(354,100%,64%,0.12), 0 0 120px hsla(354,100%,64%,0.06)' }}
              >
                <span className="text-3xl font-black gradient-text font-heading">L</span>
                <div className="absolute -inset-2 rounded-2xl border border-primary/8 animate-pulse" />
              </motion.div>
              <h2 className="text-2xl font-black tracking-heading font-heading">LSM</h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/40 mt-1.5 font-heading">Leave & Shrinkage Manager</p>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-lg font-bold font-heading">Welcome Back</h3>
              <p className="text-sm text-muted-foreground/50 mt-1.5">Select your account to continue.</p>
            </div>

            {/* Quick role selector */}
            <div className="flex gap-2 mb-6">
              {[
                { role: 'admin', label: 'Admin', icon: Shield, color: 'from-primary/12 to-primary/5 border-primary/15 text-primary' },
                { role: 'supervisor', label: 'Supervisor', icon: Users, color: 'from-accent/12 to-accent/5 border-accent/15 text-accent' },
                { role: 'agent', label: 'Agent', icon: Globe, color: 'from-info/12 to-info/5 border-info/15 text-info' },
              ].map(r => (
                <button
                  key={r.role}
                  onMouseEnter={() => setHoveredRole(r.role)}
                  onMouseLeave={() => setHoveredRole(null)}
                  onClick={() => {
                    const first = seedUsers.find(u => u.role === r.role);
                    if (first) setSelectedUser(first.id);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gradient-to-b ${r.color} border transition-all duration-200 ${hoveredRole === r.role ? 'scale-[1.03] shadow-lg' : ''}`}
                >
                  <r.icon size={16} />
                  <span className="text-[10px] font-bold">{r.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] tracking-label uppercase text-muted-foreground/50 mb-2 font-semibold font-heading">
                  User Account
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                  <select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    className="glass-input pl-11"
                  >
                    <option value="">Choose a user…</option>
                    <optgroup label="👤 Admins">
                      {seedUsers.filter(u => u.role === 'admin').map(u => (
                        <option key={u.id} value={u.id}>{u.name} — Admin</option>
                      ))}
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] tracking-label uppercase text-muted-foreground/50 font-semibold font-heading">Password</label>
                  <span className="text-[11px] text-primary/60 font-medium cursor-pointer hover:text-primary hover:underline transition-colors">Forgot?</span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="glass-input pl-11"
                    defaultValue="prototype"
                    readOnly
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={!selectedUser || loading}
                className="w-full btn-primary-gradient text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-40 text-sm shadow-2xl shadow-primary/20 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border/25" />
                <span className="text-[10px] text-muted-foreground/25 uppercase tracking-wider font-heading">or</span>
                <div className="flex-1 h-px bg-border/25" />
              </div>

              <button className="w-full bg-card/60 border border-border/35 text-foreground/70 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm hover:bg-card/80 hover:border-border/50 transition-all">
                <Fingerprint size={16} className="text-muted-foreground/40" />
                Sign in with SSO
              </button>

              <p className="text-center text-[11px] text-muted-foreground/35 pt-1">
                No account? <span className="text-primary/60 font-semibold cursor-pointer hover:text-primary hover:underline transition-colors">Contact Admin</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-0 right-0 text-center z-10">
        <span className="text-[10px] text-muted-foreground/15 font-medium">© 2026 Leave & Shrinkage Manager — Enterprise</span>
      </div>
    </div>
  );
}
