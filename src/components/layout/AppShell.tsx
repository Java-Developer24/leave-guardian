import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Calendar, ArrowLeftRight, CheckSquare, Users,
  Upload, Settings, BarChart3, LogOut, Menu, Search, Bell, ChevronLeft,
  ChevronDown, Sparkles
} from 'lucide-react';
import { useState } from 'react';

const navSections: Record<string, { label: string; items: { to: string; label: string; icon: typeof Home }[] }[]> = {
  agent: [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/agent/home', label: 'Dashboard', icon: Home },
        { to: '/agent/summary', label: 'Leave Summary', icon: FileText },
      ],
    },
    {
      label: 'ACTIONS',
      items: [
        { to: '/agent/leave', label: 'Apply Leave', icon: Calendar },
        { to: '/agent/requests', label: 'Swap / Transfer', icon: ArrowLeftRight },
      ],
    },
  ],
  supervisor: [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/supervisor/home', label: 'Dashboard', icon: Home },
      ],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { to: '/supervisor/approvals', label: 'Approvals', icon: CheckSquare },
        { to: '/supervisor/team', label: 'Team Overview', icon: Users },
      ],
    },
  ],
  admin: [
    {
      label: 'DATA',
      items: [
        { to: '/admin/uploads/schedule', label: 'Upload Schedule', icon: Upload },
        { to: '/admin/uploads/attendance', label: 'Upload Attendance', icon: Upload },
      ],
    },
    {
      label: 'CONFIGURATION',
      items: [
        { to: '/admin/config/leave-window', label: 'Leave Window', icon: Settings },
        { to: '/admin/config/shrinkage', label: 'Shrinkage Rules', icon: Settings },
        { to: '/admin/config/holidays', label: 'Holiday Master', icon: Calendar },
      ],
    },
    {
      label: 'INSIGHTS',
      items: [
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
  ],
};

const roleLabels: Record<string, string> = {
  agent: 'Agent',
  supervisor: 'Supervisor',
  admin: 'Admin',
};

const roleBadgeColors: Record<string, string> = {
  agent: 'bg-info/15 text-info',
  supervisor: 'bg-accent/15 text-accent',
  admin: 'bg-primary/15 text-primary',
};

function getPageTitle(pathname: string): string {
  const allSections = [...(navSections.agent ?? []), ...(navSections.supervisor ?? []), ...(navSections.admin ?? [])];
  const allItems = allSections.flatMap(s => s.items);
  return allItems.find(i => i.to === pathname)?.label ?? 'Dashboard';
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center font-bold text-primary border border-primary/10`}>
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Don't show shell for landing and login
  if (!currentUser || location.pathname === '/' || location.pathname === '/login') return <>{children}</>;

  const sections = navSections[currentUser.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center flex-shrink-0 border border-primary/10">
            <span className="text-primary font-extrabold text-base gradient-text">L</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-foreground tracking-heading">LSM</h1>
              <p className="text-[9px] text-muted-foreground tracking-section uppercase">LEAVE & SHRINKAGE</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin space-y-4 mt-2" aria-label="Main navigation">
        {sections.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <span className="text-[9px] font-bold tracking-section uppercase text-muted-foreground/40 px-3 mb-1.5 block">{section.label}</span>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                      ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                      }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <item.icon size={17} className={active ? 'text-primary' : ''} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user profile */}
      <div className="p-3 mt-auto">
        <div className="border-t border-sidebar-border pt-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-secondary/30">
              <UserAvatar name={currentUser.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{currentUser.name}</div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${roleBadgeColors[currentUser.role]}`}>
                  {roleLabels[currentUser.role]}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full rounded-lg hover:bg-secondary/30"
          >
            <ChevronLeft size={14} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Collapse'}
          </button>
          <div className="flex items-center gap-2 px-3">
            <Sparkles size={10} className="text-muted-foreground/30" />
            <span className="text-[9px] text-muted-foreground/30">LSM v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background mesh-bg">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/50 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
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
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="relative w-[240px] h-full bg-sidebar border-r border-sidebar-border"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-[60px] border-b border-border/40 bg-surface/60 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground/50">LSM</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="font-medium text-foreground">{getPageTitle(location.pathname)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="relative p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <div className="w-px h-7 bg-border/40 mx-1.5" />
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary transition-colors"
              >
                <UserAvatar name={currentUser.name} size="sm" />
                {!collapsed && (
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold">{currentUser.name}</div>
                    <div className="text-[10px] text-muted-foreground">{currentUser.email}</div>
                  </div>
                )}
                <ChevronDown size={14} className="text-muted-foreground hidden md:block" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 z-50"
                  >
                    <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                      <div className="text-sm font-semibold">{currentUser.name}</div>
                      <div className="text-[11px] text-muted-foreground">{currentUser.email}</div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${roleBadgeColors[currentUser.role]}`}>
                        {roleLabels[currentUser.role]}
                      </span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          {children}
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
}
