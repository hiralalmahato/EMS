import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users, UserCheck, UserPlus, Building2,
  TrendingUp, ArrowRight, Calendar, Gift,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#0f766e', '#14b8a6', '#5eead4', '#99f6e4', '#2dd4bf', '#0d9488', '#115e59', '#134e4a', '#ccfbf1', '#042f2e'];

function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</p>
          {loading ? (
            <div className="mt-1.5 h-7 w-16 animate-pulse rounded bg-[hsl(var(--muted))]" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-[hsl(var(--foreground))]">{value}</p>
          )}
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return <div className="h-64 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/reports/dashboard/');
        setData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpi = data?.kpi || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Welcome back, {user?.first_name}. Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Employees" value={kpi.total_employees ?? '—'} icon={Users} color="bg-[hsl(var(--primary))]" loading={loading} />
        <StatCard label="Active" value={kpi.active_employees ?? '—'} icon={UserCheck} color="bg-emerald-600" loading={loading} />
        <StatCard label="New This Month" value={kpi.new_hires_month ?? '—'} icon={UserPlus} color="bg-sky-600" loading={loading} />
        <StatCard label="Departments" value={kpi.departments ?? '—'} icon={Building2} color="bg-amber-600" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Headcount Trend */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Headcount Trend</h2>
            <TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          {loading ? <SkeletonChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.headcount_trend || []} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} barSize={28} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Distribution */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Department Distribution</h2>
            <Building2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          {loading ? <SkeletonChart /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={240}>
                <PieChart>
                  <Pie
                    data={(data?.department_distribution || []).filter(d => d.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {(data?.department_distribution || []).filter(d => d.count > 0).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {(data?.department_distribution || []).filter(d => d.count > 0).map((dept, i) => (
                  <div key={dept.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[hsl(var(--foreground))]">{dept.name}</span>
                    </div>
                    <span className="font-medium text-[hsl(var(--muted-foreground))]">{dept.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Employees */}
        <div className="lg:col-span-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Recent Employees</h2>
            <Link to="/employees" className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-[hsl(var(--muted))]" />
              ))}
            </div>
          ) : (data?.recent_employees?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-[hsl(var(--muted-foreground))]">
              <Users className="h-8 w-8 mb-2 opacity-40" />
              No employees found.
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {data.recent_employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    <span className="text-[11px] font-medium">{emp.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{emp.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{emp.designation || emp.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{emp.employee_id}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{emp.joining_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Upcoming Birthdays</h2>
            <Gift className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-[hsl(var(--muted))]" />
              ))}
            </div>
          ) : (data?.upcoming_birthdays?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-[hsl(var(--muted-foreground))]">
              <Calendar className="h-8 w-8 mb-2 opacity-40" />
              No upcoming birthdays.
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {data.upcoming_birthdays.map((bday, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400">
                    <Gift className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{bday.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{bday.department}</p>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{bday.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (admin/hr only) */}
      {(user?.role === 'admin' || user?.role === 'hr_manager') && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h2 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/employees?action=add"
              className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Employee
            </Link>
            <Link
              to="/departments"
              className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" /> Departments
            </Link>
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" /> Attendance
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
