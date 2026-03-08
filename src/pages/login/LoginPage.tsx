import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { pageTransition } from '@/styles/motion';
import { seedUsers } from '@/data/seeds';
import { LogIn } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div {...pageTransition} className="glass-card-featured p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text tracking-heading mb-2">WatchTower</h1>
          <p className="text-muted-foreground text-sm">Leave & Shrinkage Manager</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-label uppercase text-muted-foreground mb-2 font-medium">
              Select User (Prototype)
            </label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="">Choose a user...</option>
              {seedUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedUser || loading}
            className="w-full btn-primary-gradient text-primary-foreground font-semibold py-2.5 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            <LogIn size={18} />
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Prototype mode — no authentication required
        </p>
      </motion.div>
    </div>
  );
}
