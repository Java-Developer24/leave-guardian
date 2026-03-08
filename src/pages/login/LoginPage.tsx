import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { seedUsers } from '@/data/seeds';
import { ArrowRight, Shield, Calendar, BarChart3, Mail, Lock, Sparkles, CheckCircle } from 'lucide-react';

const features = [
  { icon: Calendar, label: 'Smart leave planning & automated window control' },
  { icon: BarChart3, label: 'Real-time shrinkage analytics & forecasting' },
  { icon: Shield, label: 'Role-based access with multi-level approvals' },
  { icon: CheckCircle, label: 'Swap & transfer workflows with peer acceptance' },
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
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-6"
          >
            <Sparkles size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Secure Portal</span>
          </motion.div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-heading leading-[1.15]">
            Leave &<br />
            <span className="gradient-text">Shrinkage Manager</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-md mt-5 leading-relaxed">
            Access your leave dashboards, track shrinkage metrics, and manage team approvals with intelligent workflows.
          </p>

          <div className="mt-10 space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <f.icon size={18} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative */}
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right — Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="glass-card-featured accent-top-card w-full max-w-md p-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 40px hsla(356,98%,62%,0.1)' }}>
              <span className="text-2xl font-extrabold gradient-text">L</span>
            </div>
            <h2 className="text-xl font-bold tracking-heading">LSM</h2>
            <p className="text-[10px] tracking-section uppercase text-muted-foreground mt-1">LEAVE & SHRINKAGE MANAGER</p>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">Welcome Back</h3>
            <p className="text-sm text-muted-foreground mt-1">Select your credentials to continue.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-label uppercase text-muted-foreground mb-2 font-semibold">
                USER ACCOUNT
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="glass-input pl-10"
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
                <label className="text-[10px] tracking-label uppercase text-muted-foreground font-semibold">PASSWORD</label>
                <span className="text-[11px] text-primary font-medium cursor-pointer hover:underline">Forgot?</span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="glass-input pl-10"
                  defaultValue="prototype"
                  readOnly
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!selectedUser || loading}
              className="w-full btn-primary-gradient text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 disabled:opacity-40 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <button className="w-full bg-secondary/40 border border-border/60 text-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-secondary/60 transition-all">
              <Shield size={16} className="text-muted-foreground" />
              Sign in with SSO
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              No account? <span className="text-primary font-medium cursor-pointer hover:underline">Contact Admin</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center z-10">
        <span className="text-[10px] text-muted-foreground/30">© 2026 Leave & Shrinkage Manager</span>
      </div>
    </div>
  );
}
