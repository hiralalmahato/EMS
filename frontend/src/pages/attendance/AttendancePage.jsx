import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  present: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  late: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  absent: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  half_day: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  on_leave: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  holiday: 'bg-zinc-100 text-zinc-600',
  weekend: 'bg-zinc-100 text-zinc-500',
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, recordsRes] = await Promise.all([
        api.get('/attendance/today/'),
        api.get('/attendance/', { params: { page_size: 30 } }),
      ]);
      setTodayRecord(todayRes.data);
      setRecords(recordsRes.data.results || recordsRes.data);

      if (isAdmin) {
        const summaryRes = await api.get('/attendance/summary/');
        setSummary(summaryRes.data);
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await api.post('/attendance/check_in/');
      setTodayRecord(res.data);
      toast.success('Checked in successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to check in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const res = await api.post('/attendance/check_out/');
      setTodayRecord(res.data);
      toast.success('Checked out successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to check out.');
    } finally {
      setCheckingOut(false);
    }
  };

  const hasCheckedIn = todayRecord?.check_in;
  const hasCheckedOut = todayRecord?.check_out;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Attendance</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's Status & Check In/Out */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h2 className="text-sm font-medium text-[hsl(var(--foreground))] mb-4">Today's Status</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 rounded-md border border-[hsl(var(--border))] p-4 text-center">
              <LogIn className="h-5 w-5 mx-auto mb-1.5 text-[hsl(var(--primary))]" />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Check In</p>
              <p className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">
                {hasCheckedIn ? new Date(todayRecord.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
            <div className="flex-1 rounded-md border border-[hsl(var(--border))] p-4 text-center">
              <LogOut className="h-5 w-5 mx-auto mb-1.5 text-[hsl(var(--muted-foreground))]" />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Check Out</p>
              <p className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">
                {hasCheckedOut ? new Date(todayRecord.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
            <div className="flex-1 rounded-md border border-[hsl(var(--border))] p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1.5 text-emerald-600" />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Working Hours</p>
              <p className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">
                {todayRecord?.working_hours ? `${todayRecord.working_hours}h` : '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50"
              >
                {checkingIn ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <LogIn className="h-4 w-4" />}
                Check In
              </button>
            )}
            {hasCheckedIn && !hasCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-4 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] disabled:opacity-50"
              >
                {checkingOut ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <LogOut className="h-4 w-4" />}
                Check Out
              </button>
            )}
            {hasCheckedIn && hasCheckedOut && (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Attendance recorded for today
              </p>
            )}
          </div>
        </div>

        {/* Summary (admin/HR) */}
        {isAdmin && summary && (
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Today's Summary</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Total Employees', value: summary.total_employees, color: 'text-[hsl(var(--foreground))]' },
                { label: 'Present', value: summary.present, color: 'text-emerald-600' },
                { label: 'Late', value: summary.late, color: 'text-amber-600' },
                { label: 'Absent', value: summary.absent, color: 'text-red-600' },
                { label: 'On Leave', value: summary.on_leave, color: 'text-violet-600' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</span>
                  <span className={cn('text-sm font-semibold', item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
          <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
                {isAdmin && <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employee</th>}
                <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Check In</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Check Out</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Hours</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={isAdmin ? 6 : 5} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No attendance records found.</td></tr>
              ) : (
                records.map(r => (
                  <tr key={r.id} className="hover:bg-[hsl(var(--accent))]/50">
                    {isAdmin && <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">{r.employee_name}</td>}
                    <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">{r.date}</td>
                    <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))] font-mono">{r.working_hours || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[r.status] || 'bg-zinc-100 text-zinc-600')}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
