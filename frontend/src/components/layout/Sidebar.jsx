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
        'flex h-screen flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[hsl(var(--border))] px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-white">
          <span className="text-xs font-bold">W</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">Workly</span>
        )}
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
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                  )
                }
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[hsl(var(--border))] p-2">
        {!collapsed && user && (
          <div className="mb-2 px-2.5 py-1.5">
            <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] capitalize">
              {user.role?.replace('_', ' ')}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors mt-0.5"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
