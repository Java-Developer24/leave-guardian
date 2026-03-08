import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Calendar, ArrowLeftRight, CheckSquare, Users,
  Upload, Settings, BarChart3, LogOut, Menu, Search, Bell, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const navItems: Record<string, { to: string; label: string; icon: typeof Home }[]> = {
  agent: [
    { to: '/agent/home', label: 'Dashboard', icon: Home },
    { to: '/agent/summary', label: 'Leave Summary', icon: FileText },
    { to: '/agent/leave', label: 'Apply Leave', icon: Calendar },
    { to: '/agent/requests', label: 'Swap / Transfer', icon: ArrowLeftRight },
  ],
  supervisor: [
    { to: '/supervisor/home', label: 'Dashboard', icon: Home },
    { to: '/supervisor/approvals', label: 'Approvals', icon: CheckSquare },
    { to: '/supervisor/team', label: 'Team Overview', icon: Users },
  ],
  admin: [
    { to: '/admin/uploads/schedule', label: 'Upload Schedule', icon: Upload },
    { to: '/admin/uploads/attendance', label: 'Upload Attendance', icon: Upload },
    { to: '/admin/config/leave-window', label: 'Leave Window', icon: Settings },
    { to: '/admin/config/shrinkage', label: 'Shrinkage Rules', icon: Settings },
    { to: '/admin/config/holidays', label: 'Holiday Master', icon: Calendar },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

const roleLabels: Record<string, string> = {
  agent: 'AGENT PORTAL',
  supervisor: 'SUPERVISOR',
  admin: 'ADMIN PANEL',
};

function getPageTitle(pathname: string): string {
  const all = [...navItems.agent, ...navItems.supervisor, ...navItems.admin];
  return all.find(i => i.to === pathname)?.label ?? 'Dashboard';
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
      {initials}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) return <>{children}</>;
  const items = navItems[currentUser.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-extrabold text-sm">W</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-foreground tracking-heading">WatchTower</h1>
              <p className="text-[10px] text-muted-foreground tracking-section uppercase">ENTERPRISE</p>
            </div>
          )}
        </div>
      </div>

      {/* Module Label */}
      <div className="px-5 pb-2">
        <span className="text-[10px] font-semibold tracking-section uppercase text-muted-foreground/60">MODULES</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
        {items.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                ${active
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40'
                }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-border"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon size={17} />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto notification-dot relative" style={{ position: 'static', width: 6, height: 6 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 mt-auto">
        <div className="border-t border-sidebar-border pt-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full"
          >
            <ChevronLeft size={14} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Collapse'}
          </button>
          <div className="flex items-center gap-2 px-1 mt-2">
            <span className="text-[10px] text-muted-foreground/40">WatchTower v2.1</span>
          </div>
          <p className="text-[9px] text-muted-foreground/30 px-1">© 2026 WatchTower Inc.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring' as const, stiffness: 400, damping: 35 }}
              className="relative w-[220px] h-full bg-sidebar border-r border-sidebar-border"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 border-b border-border bg-surface/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded bg-secondary flex items-center justify-center">
                <FileText size={12} />
              </span>
              <span className="font-medium text-foreground">{getPageTitle(location.pathname)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" style={{ boxShadow: '0 0 6px hsla(356,98%,62%,0.6)' }} />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <UserAvatar name={currentUser.name} />
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
