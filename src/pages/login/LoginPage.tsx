import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { seedUsers } from '@/data/seeds';
import { ArrowRight, Shield, Calendar, BarChart3, Mail, Lock, Sparkles, CheckCircle, Fingerprint, Zap, Users, Activity } from 'lucide-react';

const features = [
  { icon: Calendar, label: 'Smart leave planning with automated window control', color: 'text-primary' },
  { icon: BarChart3, label: 'Real-time shrinkage analytics & trend forecasting', color: 'text-accent' },
  { icon: Shield, label: 'Role-based access with multi-level approval chains', color: 'text-info' },
  { icon: CheckCircle, label: 'Swap & transfer workflows with peer acceptance', color: 'text-success' },
  { icon: Zap, label: 'Instant notifications and live status updates', color: 'text-warning' },
];

const statCards = [
  { value: '10K+', label: 'Leaves Managed', icon: Activity },
  { value: '500+', label: 'Active Teams', icon: Users },
  { value: '99.9%', label: 'Uptime', icon: Zap },
];

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
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
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(225,12%,30%,0.12) 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-float" style={{ background: 'radial-gradient(circle, hsla(354,100%,64%,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] animate-float-delayed" style={{ background: 'radial-gradient(circle, hsla(35,100%,60%,0.05) 0%, transparent 70%)' }} />
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
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-heading">Secure Portal</span>
          </motion.div>

          <h1 className="text-5xl xl:text-6xl font-black tracking-[-0.04em] leading-[1.05] font-heading">
            Leave &<br />
            <span className="gradient-text">Shrinkage</span>
            <br />Manager
          </h1>
          <p className="text-muted-foreground/70 text-base max-w-md mt-7 leading-relaxed">
            Access your dashboards, track shrinkage metrics, and manage approvals with intelligent, automated workflows.
          </p>

          <div className="mt-12 space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-card/80 flex items-center justify-center flex-shrink-0 group-hover:bg-card transition-colors border border-border/30 group-hover:border-border/50 group-hover:scale-105 transition-all duration-300">
                  <f.icon size={17} className={f.color} />
                </div>
                <span className="text-sm text-muted-foreground/60 group-hover:text-muted-foreground transition-colors duration-300">{f.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Mini stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex items-center gap-8 mt-14 pt-8 border-t border-border/20"
          >
            {statCards.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black gradient-text font-heading">{s.value}</div>
                <div className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground/40 font-heading mt-1">{s.label}</div>
              </div>
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
          className="w-full max-w-[440px] relative"
        >
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent opacity-60" />
          <div className="relative bg-card/95 backdrop-blur-2xl rounded-3xl p-10 border border-border/30">
            {/* Accent bar */}
            <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-primary via-accent to-info rounded-b-full" />

            {/* Logo */}
            <div className="text-center mb-10 mt-2">
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15 flex items-center justify-center mx-auto mb-5 relative" style={{ boxShadow: '0 0 60px hsla(354,100%,64%,0.1)' }}>
                <span className="text-3xl font-black gradient-text font-heading">L</span>
              </div>
              <h2 className="text-2xl font-black tracking-heading font-heading">LSM</h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/50 mt-1.5 font-heading">Leave & Shrinkage Manager</p>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-lg font-bold font-heading">Welcome Back</h3>
              <p className="text-sm text-muted-foreground/60 mt-1.5">Select your credentials to continue.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] tracking-label uppercase text-muted-foreground/60 mb-2.5 font-semibold font-heading">
                  User Account
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
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
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-[10px] tracking-label uppercase text-muted-foreground/60 font-semibold font-heading">Password</label>
                  <span className="text-[11px] text-primary/70 font-medium cursor-pointer hover:text-primary hover:underline transition-colors">Forgot?</span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
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
                className="w-full btn-primary-gradient text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-40 text-sm shadow-2xl shadow-primary/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[10px] text-muted-foreground/30 uppercase tracking-wider font-heading">or</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              <button className="w-full bg-card/60 border border-border/40 text-foreground/80 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm hover:bg-card/80 hover:border-border/60 transition-all">
                <Fingerprint size={16} className="text-muted-foreground/50" />
                Sign in with SSO
              </button>

              <p className="text-center text-[11px] text-muted-foreground/40 pt-1">
                No account? <span className="text-primary/70 font-semibold cursor-pointer hover:text-primary hover:underline transition-colors">Contact Admin</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-0 right-0 text-center z-10">
        <span className="text-[10px] text-muted-foreground/20 font-medium">© 2026 Leave & Shrinkage Manager</span>
      </div>
    </div>
  );
}
