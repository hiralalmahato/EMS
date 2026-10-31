import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  DollarSign,
  Target,
  Briefcase,
  UserPlus,
  CheckSquare,
  BarChart3,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'hr_manager', 'employee'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'hr_manager'] },
  { name: 'Departments', href: '/departments', icon: Building2, roles: ['admin', 'hr_manager'] },
  { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['admin', 'hr_manager', 'employee'] },
  { name: 'Leave', href: '/leaves', icon: CalendarDays, roles: ['admin', 'hr_manager', 'employee'] },
  { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['admin'] },
  { name: 'Performance', href: '/performance', icon: Target, roles: ['admin', 'hr_manager', 'employee'] },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase, roles: ['admin', 'hr_manager'] },
  { name: 'Onboarding', href: '/onboarding', icon: UserPlus, roles: ['admin', 'hr_manager'] },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['admin', 'hr_manager', 'employee'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'hr_manager'] },
  { name: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['admin', 'hr_manager', 'employee'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredNav = navigation.filter((item) => item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-250 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-56'
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[hsl(var(--border))] px-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white transition-transform duration-200 hover:scale-105">
          <span className="text-xs font-bold tracking-tight">W</span>
        </div>
        <span
          className={cn(
            'text-sm font-semibold text-[hsl(var(--foreground))] tracking-tight transition-all duration-200',
            collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          )}
        >
          Workly
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-0.5">
          {filteredNav.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] hover:translate-x-[1px]'
                  )
                }
                title={collapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[hsl(var(--primary))]" />
                    )}
                    <item.icon className="h-[16px] w-[16px] shrink-0" />
                    <span
                      className={cn(
                        'transition-all duration-200 whitespace-nowrap',
                        collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                      )}
                    >
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[hsl(var(--border))] p-2">
        <div
          className={cn(
            'transition-all duration-200 overflow-hidden',
            collapsed ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100 mb-1'
          )}
        >
          {user && (
            <div className="px-2.5 py-1.5">
              <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] capitalize">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn('transition-all duration-200', collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100')}>
            Sign out
          </span>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all duration-200 mt-0.5"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className={cn('shrink-0 transition-transform duration-250', collapsed ? 'rotate-0' : 'rotate-180')}>
            <ChevronRight className="h-4 w-4" />
          </div>
          <span className={cn('transition-all duration-200', collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100')}>
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
}
