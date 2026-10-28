import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  BarChart3,
  CalendarDays,
  DollarSign,
  Users,
  Loader2,
  Download,
} from 'lucide-react';

const COLORS = ['#0d9488', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#10b981'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REPORT_TABS = [
  { key: 'overview', label: 'Overview', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: BarChart3 },
  { key: 'leave', label: 'Leave', icon: CalendarDays },
  { key: 'payroll', label: 'Payroll', icon: DollarSign },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async (type) => {
    try {
      setLoading(true);
      const res = await api.get('/reports/reports/', { params: { type } });
      setData(res.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setData(null);
  };

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Reports</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Analytics and insights across the organization
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-md bg-[hsl(var(--secondary))] p-0.5 w-fit">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : !data ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-20">No data available</p>
      ) : (
        <>
          {activeTab === 'overview' && <OverviewReport data={data} />}
          {activeTab === 'attendance' && <AttendanceReport data={data} />}
          {activeTab === 'leave' && <LeaveReport data={data} />}
          {activeTab === 'payroll' && <PayrollReport data={data} formatCurrency={formatCurrency} />}
        </>
      )}
    </div>
  );
}

function OverviewReport({ data }) {
  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Employees</p>
          <p className="text-2xl font-semibold text-[hsl(var(--foreground))] mt-1">{data.total_employees}</p>
        </div>
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Employees</p>
          <p className="text-2xl font-semibold text-[hsl(var(--foreground))] mt-1">{data.active_employees}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department distribution */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Headcount by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.department_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employment type */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Employment Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(data.employment_type_breakdown || []).map((d) => ({
                    name: d.employment_type?.replace('_', ' ') || 'Unknown',
                    value: d.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {(data.employment_type_breakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender breakdown */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Gender Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(data.gender_breakdown || []).map((d) => ({
                    name: d.gender ? d.gender.charAt(0).toUpperCase() + d.gender.slice(1) : 'Not Specified',
                    value: d.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {(data.gender_breakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent hires */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Recent Hires</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">ID</th>
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Name</th>
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Dept</th>
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {(data.recent_hires || []).map((emp) => (
                  <tr key={emp.employee_id}>
                    <td className="py-2 text-xs text-[hsl(var(--muted-foreground))] font-mono">{emp.employee_id}</td>
                    <td className="py-2 text-xs text-[hsl(var(--foreground))]">{emp.user__first_name} {emp.user__last_name}</td>
                    <td className="py-2 text-xs text-[hsl(var(--muted-foreground))]">{emp.department__name || '—'}</td>
                    <td className="py-2 text-xs text-[hsl(var(--muted-foreground))]">
                      {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceReport({ data }) {
  return (
    <div className="space-y-5">
      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(data.status_summary || []).map((item) => (
          <div key={item.status} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{item.status?.replace('_', ' ')}</p>
            <p className="text-2xl font-semibold text-[hsl(var(--foreground))] mt-1">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Daily trend */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Daily Attendance Trend (Last 30 Days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(data.daily_trend || []).map((d) => ({
              ...d,
              date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="#0d9488" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="on_leave" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department attendance */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Attendance by Department</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.department_attendance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#0d9488" radius={[3, 3, 0, 0]} name="Present Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LeaveReport({ data }) {
  return (
    <div className="space-y-5">
      {/* Pending count */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 w-fit">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Pending Leave Requests</p>
        <p className="text-2xl font-semibold text-[hsl(var(--foreground))] mt-1">{data.pending_count || 0}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave by type */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Approved Leave by Type</h3>
          {(data.leave_by_type || []).length === 0 ? (
            <p className="text-xs text-[hsl(var(--muted-foreground))] py-8 text-center">No approved leave data for this year</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(data.leave_by_type || []).map((d) => ({
                      name: d.type_name,
                      value: parseFloat(d.total_days) || 0,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value}d)`}
                  >
                    {(data.leave_by_type || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Leave by month */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Monthly Leave Utilization</h3>
          {(data.leave_by_month || []).length === 0 ? (
            <p className="text-xs text-[hsl(var(--muted-foreground))] py-8 text-center">No monthly leave data for this year</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data.leave_by_month || []).map((d) => ({
                  month: MONTHS[(d.month || 1) - 1],
                  days: parseFloat(d.total_days) || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="days" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Days Used" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayrollReport({ data, formatCurrency }) {
  return (
    <div className="space-y-5">
      {/* Monthly payroll chart */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Monthly Payroll Summary</h3>
        {(data.monthly_payroll || []).length === 0 ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))] py-8 text-center">No payroll data for this year</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data.monthly_payroll || []).map((d) => ({
                month: MONTHS[(d.period_month || 1) - 1],
                gross: parseFloat(d.total_gross) || 0,
                net: parseFloat(d.total_net) || 0,
                deductions: parseFloat(d.total_deductions) || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(val) => `$${val.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="gross" fill="#0d9488" name="Gross" radius={[3, 3, 0, 0]} />
                <Bar dataKey="net" fill="#0ea5e9" name="Net" radius={[3, 3, 0, 0]} />
                <Bar dataKey="deductions" fill="#ef4444" name="Deductions" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Department payroll */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Payroll by Department</h3>
        {(data.department_payroll || []).length === 0 ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))] py-8 text-center">No department payroll data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Department</th>
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Total Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {(data.department_payroll || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-xs text-[hsl(var(--foreground))]">{item.department || 'Unassigned'}</td>
                    <td className="py-2.5 text-xs text-[hsl(var(--foreground))] text-right font-mono">
                      ${parseFloat(item.total_net || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
