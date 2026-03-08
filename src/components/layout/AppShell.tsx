import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Calendar, ArrowLeftRight, CheckSquare, Users,
  Upload, Settings, BarChart3, LogOut, Menu, Search, Bell, ChevronLeft,
  ChevronDown, Sparkles, X, Power
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const navSections: Record<string, { label: string; items: { to: string; label: string; icon: typeof Home }[] }[]> = {
  agent: [
    { label: 'Overview', items: [
      { to: '/agent/home', label: 'Dashboard', icon: Home },
      { to: '/agent/summary', label: 'Leave Summary', icon: FileText },
    ]},
    { label: 'Actions', items: [
      { to: '/agent/leave', label: 'Apply Leave', icon: Calendar },
      { to: '/agent/requests', label: 'Swap / Transfer', icon: ArrowLeftRight },
    ]},
  ],
  supervisor: [
    { label: 'Overview', items: [
      { to: '/supervisor/home', label: 'Dashboard', icon: Home },
    ]},
    { label: 'Management', items: [
      { to: '/supervisor/approvals', label: 'Approvals', icon: CheckSquare },
      { to: '/supervisor/team', label: 'Team Overview', icon: Users },
    ]},
  ],
  admin: [
    { label: 'Data', items: [
      { to: '/admin/uploads/schedule', label: 'Upload Schedule', icon: Upload },
      { to: '/admin/uploads/attendance', label: 'Upload Attendance', icon: Upload },
    ]},
    { label: 'Configuration', items: [
      { to: '/admin/config/leave-window', label: 'Leave Window', icon: Settings },
      { to: '/admin/config/shrinkage', label: 'Shrinkage Rules', icon: Settings },
      { to: '/admin/config/holidays', label: 'Holiday Master', icon: Calendar },
    ]},
    { label: 'Insights', items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ]},
  ],
};

const roleLabels: Record<string, string> = { agent: 'Agent', supervisor: 'Supervisor', admin: 'Admin' };
const roleBadgeColors: Record<string, string> = {
  agent: 'bg-info/12 text-info border-info/15',
  supervisor: 'bg-accent/12 text-accent border-accent/15',
  admin: 'bg-primary/12 text-primary border-primary/15',
};

function getPageTitle(pathname: string): string {
  const allSections = [...(navSections.agent ?? []), ...(navSections.supervisor ?? []), ...(navSections.admin ?? [])];
  return allSections.flatMap(s => s.items).find(i => i.to === pathname)?.label ?? 'Dashboard';
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-9 h-9 text-[11px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm' };
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-primary/18 to-accent/8 flex items-center justify-center font-bold text-primary border border-primary/10`}>
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  if (!currentUser || location.pathname === '/' || location.pathname === '/login') return <>{children}</>;

  const sections = navSections[currentUser.role] ?? [];

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center flex-shrink-0 border border-primary/12" style={{ boxShadow: '0 0 30px hsla(354,100%,64%,0.08)' }}>
            <span className="text-primary font-black text-lg gradient-text font-heading">L</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-black text-foreground tracking-heading font-heading">LSM</h1>
              <p className="text-[8px] text-muted-foreground/40 tracking-[0.2em] uppercase font-heading mt-0.5">Leave & Shrinkage</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-hidden space-y-5 mt-3" aria-label="Main navigation">
        {sections.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground/25 px-3 mb-2 block font-heading">{section.label}</span>
            )}
            <div className="space-y-1">
              {section.items.map(item => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                      ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground/60 hover:text-foreground hover:bg-card/50'
                      }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                        style={{ boxShadow: '0 0 12px hsla(354,100%,64%,0.5)' }}
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

      {/* Bottom — Sign Out button always visible */}
      <div className="p-3 mt-auto">
        <div className="border-t border-border/20 pt-4 space-y-3">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card/50 border border-border/20">
              <UserAvatar name={currentUser.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{currentUser.name}</div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border mt-0.5 inline-block ${roleBadgeColors[currentUser.role]}`}>
                  {roleLabels[currentUser.role]}
                </span>
              </div>
            </div>
          )}

          {/* SIGN OUT BUTTON — always visible in sidebar */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-destructive/80 hover:text-destructive hover:bg-destructive/8 rounded-xl transition-all duration-200 font-medium group"
          >
            <Power size={16} className="group-hover:animate-pulse" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors w-full rounded-lg hover:bg-card/30"
          >
            <ChevronLeft size={14} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="font-medium">Collapse</span>}
          </button>
          <div className="flex items-center gap-2 px-3.5">
            <Sparkles size={10} className="text-muted-foreground/20" />
            <span className="text-[9px] text-muted-foreground/20 font-medium">LSM v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background mesh-bg">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card/40 backdrop-blur-2xl border-r border-border/20 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
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
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="relative w-[260px] h-full bg-card/95 backdrop-blur-2xl border-r border-border/20"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-card/50 transition-colors z-10">
                <X size={18} className="text-muted-foreground" />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-5 lg:px-8 h-[64px] border-b border-border/20 bg-card/30 backdrop-blur-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2.5 rounded-lg hover:bg-card/50 transition-colors" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground/30 font-medium">LSM</span>
              <span className="text-muted-foreground/15">/</span>
              <span className="font-semibold text-foreground font-heading">{getPageTitle(location.pathname)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-lg hover:bg-card/50 transition-colors text-muted-foreground/50 hover:text-muted-foreground" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="relative p-2.5 rounded-lg hover:bg-card/50 transition-colors text-muted-foreground/50 hover:text-muted-foreground" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <div className="w-px h-8 bg-border/20 mx-2" />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-card/50 transition-colors"
              >
                <UserAvatar name={currentUser.name} size="sm" />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold">{currentUser.name}</div>
                  <div className="text-[10px] text-muted-foreground/40">{currentUser.email}</div>
                </div>
                <ChevronDown size={14} className="text-muted-foreground/40 hidden md:block" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-60 bg-card/98 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-2xl p-2"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="px-3 py-3 border-b border-border/20 mb-1">
                      <div className="text-sm font-semibold">{currentUser.name}</div>
                      <div className="text-[11px] text-muted-foreground/50 mt-0.5">{currentUser.email}</div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border mt-1.5 inline-block ${roleBadgeColors[currentUser.role]}`}>
                        {roleLabels[currentUser.role]}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/8 rounded-xl transition-colors font-medium cursor-pointer"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-7 lg:p-9 scrollbar-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
