import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { ROLE_ROUTES } from '@/core/constants';
import { motion } from 'framer-motion';
import {
  Home, FileText, Calendar, ArrowLeftRight, CheckSquare, Users,
  Upload, Settings, BarChart3, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = {
  agent: [
    { to: '/agent/home', label: 'Home', icon: Home },
    { to: '/agent/summary', label: 'Summary', icon: FileText },
    { to: '/agent/leave', label: 'Apply Leave', icon: Calendar },
    { to: '/agent/requests', label: 'Requests', icon: ArrowLeftRight },
  ],
  supervisor: [
    { to: '/supervisor/home', label: 'Home', icon: Home },
    { to: '/supervisor/approvals', label: 'Approvals', icon: CheckSquare },
    { to: '/supervisor/team', label: 'Team', icon: Users },
  ],
  admin: [
    { to: '/admin/uploads/schedule', label: 'Schedule', icon: Upload },
    { to: '/admin/uploads/attendance', label: 'Attendance', icon: Upload },
    { to: '/admin/config/leave-window', label: 'Leave Window', icon: Settings },
    { to: '/admin/config/shrinkage', label: 'Shrinkage', icon: Settings },
    { to: '/admin/config/holidays', label: 'Holidays', icon: Calendar },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;
  const items = navItems[currentUser.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold gradient-text tracking-heading">WatchTower</h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-label uppercase">{currentUser.role}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
        {items.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                ${active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                }`}
            >
              <item.icon size={18} />
              {item.label}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 text-sm text-muted-foreground truncate">{currentUser.name}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/60 w-full transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            className="relative w-64 h-full bg-sidebar border-r border-sidebar-border"
          >
            {sidebarContent}
          </motion.aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface">
          <button onClick={() => setMobileOpen(true)} className="p-1" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="text-sm font-bold gradient-text">WatchTower</span>
          <div className="w-6" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
