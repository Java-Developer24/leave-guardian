import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/state/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Calendar, ArrowLeftRight, CheckSquare, Users,
  Upload, Settings, BarChart3, LogOut, Menu, Search, Bell, ChevronLeft,
  ChevronDown, X, Power
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
     
    ]},
  ],
  supervisor: [
    { label: 'Overview', items: [
      { to: '/supervisor/home', label: 'Dashboard', icon: Home },
    ]},
    { label: 'Management', items: [
      { to: '/supervisor/approvals', label: 'Approvals', icon: CheckSquare },
      { to: '/supervisor/team', label: 'Team Overview', icon: Users },
      { to: '/supervisor/schedule', label: 'Team Schedule', icon: Calendar },
    ]},
    { label: 'Insights', items: [
      { to: '/supervisor/analytics', label: 'Analytics', icon: BarChart3 },
    ]},
  ],
  manager: [
    { label: 'Operations', items: [
      { to: '/manager/schedule', label: 'Schedule View', icon: Calendar },
    ]},
    { label: 'Insights', items: [
      { to: '/manager/analytics', label: 'Analytics', icon: BarChart3 },
    ]},
  ],
  admin: [
    { label: 'Data', items: [
      { to: '/admin/uploads/schedule', label: 'Upload Schedule', icon: Upload },
      { to: '/admin/uploads/attendance', label: 'Upload Attendance', icon: Upload },
      { to: '/admin/weekoff-swaps', label: 'Week-Off Approvals', icon: CheckSquare },
    ]},
    { label: 'Operations', items: [
      { to: '/admin/schedule', label: 'Schedule View', icon: Calendar },
    ]},
    { label: 'Configuration', items: [
      { to: '/admin/config', label: 'Configuration', icon: Settings },
      { to: '/admin/config/holidays', label: 'Holiday Master', icon: Calendar },
    ]},
    { label: 'Insights', items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ]},
  ],
};

const roleLabels: Record<string, string> = { agent: 'Guide', supervisor: 'Supervisor', manager: 'Manager', admin: 'Admin' };
const roleBadgeColors: Record<string, string> = {
  agent: 'bg-info/10 text-info border-info/20',
  supervisor: 'bg-accent/10 text-accent border-accent/20',
  manager: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-primary/10 text-primary border-primary/20',
};

function getPageTitle(pathname: string): string {
  const allSections = [...(navSections.agent ?? []), ...(navSections.supervisor ?? []), ...(navSections.manager ?? []), ...(navSections.admin ?? [])];
  return allSections.flatMap(s => s.items).find(i => i.to === pathname)?.label ?? 'Dashboard';
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-9 h-9 text-[11px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm' };
  return (
    <div className={`${sizes[size]} rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/15`}>
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

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
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
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/15">
            <span className="text-primary font-black text-lg font-heading">L</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-extrabold text-foreground tracking-heading font-heading">LSM</h1>
              <p className="text-[8px] text-muted-foreground tracking-[0.15em] uppercase font-heading mt-0.5">Leave & Shrinkage Manager Tool</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-hidden space-y-5 mt-2" aria-label="Main navigation">
        {sections.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/50 px-3 mb-2 block font-heading">{section.label}</span>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                      ${active
                        ? 'bg-primary/8 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
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

      {/* Bottom */}
      <div className="p-3 mt-auto">
        <div className="border-t border-border pt-4 space-y-3">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border">
              <UserAvatar name={currentUser.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{currentUser.name}</div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border mt-0.5 inline-block ${roleBadgeColors[currentUser.role]}`}>
                  {roleLabels[currentUser.role]}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all duration-150 font-medium"
          >
            <Power size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors w-full rounded-lg hover:bg-muted/20"
          >
            <ChevronLeft size={14} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="font-medium">Collapse</span>}
          </button>
          
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-background border-r border-border flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[250px]'}`}>
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
              className="absolute inset-0 bg-foreground/20"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="relative w-[250px] h-full bg-background border-r border-border"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/30 transition-colors z-10">
                <X size={18} className="text-muted-foreground" />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 lg:px-8 h-[60px] border-b border-border bg-background flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted/30 transition-colors" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground/50 font-medium">LSM</span>
              <span className="text-muted-foreground/25">/</span>
              <span className="font-semibold text-foreground font-heading">{getPageTitle(location.pathname)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="relative p-2 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <div className="w-px h-8 bg-border mx-2" />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <UserAvatar name={currentUser.name} size="sm" />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold">{currentUser.name}</div>
                  <div className="text-[10px] text-muted-foreground">{currentUser.email}</div>
                </div>
                <ChevronDown size={14} className="text-muted-foreground hidden md:block" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-lg p-2"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="px-3 py-3 border-b border-border mb-1">
                      <div className="text-sm font-semibold">{currentUser.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{currentUser.email}</div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border mt-1.5 inline-block ${roleBadgeColors[currentUser.role]}`}>
                        {roleLabels[currentUser.role]}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-7 lg:p-8 scrollbar-hidden bg-surface/50">
          {children}
        </main>
      </div>
    </div>
  );
}
