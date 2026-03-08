import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { seedUsers, seedDepartments } from '@/data/seeds';
import { ArrowRight, Shield, Lock, Fingerprint, Users, Globe, Layers, TrendingUp } from 'lucide-react';

const statCards = [
  { value: '103', label: 'Agents', icon: Users },
  { value: '11', label: 'Depts', icon: Layers },
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
    <div className="h-screen flex bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(225,12%,30%,0.06) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-float" style={{ background: 'radial-gradient(circle, hsla(354,100%,64%,0.06) 0%, transparent 60%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] animate-float-delayed" style={{ background: 'radial-gradient(circle, hsla(35,100%,60%,0.04) 0%, transparent 60%)' }} />
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-16 relative z-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="max-w-md">
          <h1 className="text-4xl xl:text-5xl font-black tracking-[-0.04em] leading-[1.05] font-heading">
            Leave &<br /><span className="gradient-text">Shrinkage</span><br />Manager
          </h1>
          <p className="text-muted-foreground/50 text-sm max-w-sm mt-4 leading-relaxed">
            Workforce management for modern contact centers.
          </p>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-8 mt-8 pt-6 border-t border-border/10"
          >
            {statCards.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black gradient-text font-heading">{s.value}</div>
                <div className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground/30 font-heading mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right — Login */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[420px] relative">
          {/* Glow */}
          <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-br from-primary/15 via-accent/10 to-info/8 opacity-50 blur-sm" />

          <div className="relative bg-surface/90 backdrop-blur-3xl rounded-[22px] p-7 border border-border/25">
            {/* Accent bar */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-primary via-accent to-info rounded-b-full" />

            {/* Logo */}
            <div className="text-center mb-6 mt-1">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
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
                { role: 'admin', label: 'Admin', icon: Shield, color: 'from-primary/10 to-primary/4 border-primary/12 text-primary' },
                { role: 'supervisor', label: 'Supervisor', icon: Users, color: 'from-accent/10 to-accent/4 border-accent/12 text-accent' },
                { role: 'agent', label: 'Agent', icon: Globe, color: 'from-info/10 to-info/4 border-info/12 text-info' },
              ].map(r => (
                <button key={r.role} onMouseEnter={() => setHoveredRole(r.role)} onMouseLeave={() => setHoveredRole(null)}
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
                <label className="block text-[9px] tracking-label uppercase text-muted-foreground/50 mb-1.5 font-semibold font-heading">User Account</label>
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="glass-input py-2.5 text-xs">
                  <option value="">Choose a user…</option>
                  <optgroup label="👤 Admins">
                    {seedUsers.filter(u => u.role === 'admin').map(u => <option key={u.id} value={u.id}>{u.name} — Admin</option>)}
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

              <button onClick={handleLogin} disabled={!selectedUser || loading}
                className="w-full btn-primary-gradient text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 text-sm mt-1"
              >
                {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><span>Sign In</span> <ArrowRight size={15} /></>}
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
                No account? <span className="text-primary/50 font-semibold cursor-pointer hover:text-primary transition-colors">Contact Admin</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
