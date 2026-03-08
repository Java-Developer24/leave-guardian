import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { seedUsers } from '@/data/seeds';
import { ArrowRight, Shield, Calendar, BarChart3, Mail, Lock, Sparkles, CheckCircle, Fingerprint, Zap } from 'lucide-react';

const features = [
  { icon: Calendar, label: 'Smart leave planning with automated window control' },
  { icon: BarChart3, label: 'Real-time shrinkage analytics & trend forecasting' },
  { icon: Shield, label: 'Role-based access with multi-level approval chains' },
  { icon: CheckCircle, label: 'Swap & transfer workflows with peer acceptance' },
  { icon: Zap, label: 'Instant notifications and live status updates' },
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
    <div className="min-h-screen flex bg-background mesh-bg">
      {/* Left — Info Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-14 xl:px-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2.5 bg-primary/8 border border-primary/15 px-4 py-2 rounded-full mb-8"
          >
            <Sparkles size={13} className="text-primary animate-glow-breathe" />
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-heading">Secure Portal</span>
          </motion.div>

          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-heading leading-[1.08] font-heading">
            Leave &<br />
            <span className="gradient-text">Shrinkage</span>
            <br />Manager
          </h1>
          <p className="text-muted-foreground text-base max-w-md mt-6 leading-relaxed">
            Access your dashboards, track shrinkage metrics, and manage approvals with intelligent, automated workflows.
          </p>

          <div className="mt-12 space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/14 transition-colors border border-primary/8 group-hover:border-primary/15">
                  <f.icon size={17} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative */}
        <div className="glow-orb w-72 h-72 bg-primary/5 bottom-16 left-16" />
        <div className="glow-orb w-48 h-48 bg-accent/4 top-20 right-10" />
      </div>

      {/* Right — Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="glass-card-featured accent-top-card w-full max-w-[440px] p-9"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/12 flex items-center justify-center mx-auto mb-5 w-[72px] h-[72px]" style={{ boxShadow: '0 0 50px hsla(354,100%,64%,0.12)' }}>
              <span className="text-3xl font-extrabold gradient-text font-heading">L</span>
            </div>
            <h2 className="text-2xl font-bold tracking-heading font-heading">LSM</h2>
            <p className="text-[10px] tracking-section uppercase text-muted-foreground mt-1.5 font-heading">Leave & Shrinkage Manager</p>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold font-heading">Welcome Back</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Select your credentials to continue.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] tracking-label uppercase text-muted-foreground mb-2 font-semibold font-heading">
                User Account
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="glass-input pl-11"
                >
                  <option value="">Choose a user…</option>
                  {seedUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] tracking-label uppercase text-muted-foreground font-semibold font-heading">Password</label>
                <span className="text-[11px] text-primary font-medium cursor-pointer hover:underline">Forgot?</span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
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
              className="w-full btn-primary-gradient text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-40 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-heading">or</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            <button className="w-full bg-secondary/40 border border-border/50 text-foreground font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm hover:bg-secondary/60 transition-all">
              <Fingerprint size={16} className="text-muted-foreground" />
              Sign in with SSO
            </button>

            <p className="text-center text-[11px] text-muted-foreground pt-1">
              No account? <span className="text-primary font-semibold cursor-pointer hover:underline">Contact Admin</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-0 right-0 text-center z-10">
        <span className="text-[10px] text-muted-foreground/25 font-medium">© 2026 Leave & Shrinkage Manager</span>
      </div>
    </div>
  );
}
