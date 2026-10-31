import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Bell, Sun, Moon, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/attendance': 'Attendance',
  '/leaves': 'Leave Management',
  '/payroll': 'Payroll',
  '/performance': 'Performance',
  '/recruitment': 'Recruitment',
  '/onboarding': 'Onboarding',
  '/tasks': 'Tasks',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/announcements': 'Announcements',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const pageTitle = PAGE_TITLES[basePath] || PAGE_TITLES[location.pathname] || '';

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread_count/');
        if (mounted) setUnreadCount(res.data.count || 0);
      } catch {
        // Ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, [location.pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Left: Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[hsl(var(--foreground))] tracking-tight">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="relative hidden sm:block mr-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="h-8 w-52 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-8 pr-3 text-xs placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:border-[hsl(var(--ring))]"
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--destructive))] px-1 text-[9px] font-bold text-white animate-scale-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[hsl(var(--accent))] transition-all duration-200"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
              <span className="text-xs font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <ChevronDown className={cn(
              'h-3 w-3 text-[hsl(var(--muted-foreground))] transition-transform duration-200',
              profileOpen && 'rotate-180'
            )} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="dropdown-menu absolute right-0 top-full z-50 mt-1.5 w-48 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-lg">
                <div className="px-3 py-2 border-b border-[hsl(var(--border))]">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
