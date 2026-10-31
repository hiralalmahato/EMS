import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserPlus, CheckCircle, Clock, AlertCircle, ListChecks } from 'lucide-react';
import { cn } from '../../utils/cn';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  in_progress: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  overdue: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
};

export default function OnboardingPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/onboarding/tasks/')
      .then(res => setTasks(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Onboarding</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">New employee onboarding tasks and progress</p>
      </div>

      {/* Summary cards */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-1">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Total Tasks</p>
            <p className="text-xl font-semibold text-[hsl(var(--foreground))] mt-0.5 tracking-tight">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-2">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Pending</p>
            <p className="text-xl font-semibold text-amber-600 mt-0.5 tracking-tight">{stats.pending}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-3">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Completed</p>
            <p className="text-xl font-semibold text-emerald-600 mt-0.5 tracking-tight">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-4">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Completion</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-semibold text-[hsl(var(--primary))] tracking-tight">{completionRate}%</p>
              <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))]">
                <div className="h-full rounded-full bg-[hsl(var(--primary))] animate-progress-fill" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto animate-slide-up delay-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employee</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Task</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden sm:table-cell">Due Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>
            )) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No onboarding tasks found.
                </td>
              </tr>
            ) : tasks.map(t => (
              <tr key={t.id} className="table-row-hover">
                <td className="px-4 py-2.5">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))]">{t.employee_name}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))]">{t.title}</p>
                  {t.description && <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate max-w-xs mt-0.5">{t.description}</p>}
                </td>
                <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] capitalize hidden md:table-cell">{t.category?.replace('_', ' ')}</td>
                <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hidden sm:table-cell whitespace-nowrap">{t.due_date}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[t.status] || 'bg-zinc-100 text-zinc-600')}>
                    {t.status?.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
