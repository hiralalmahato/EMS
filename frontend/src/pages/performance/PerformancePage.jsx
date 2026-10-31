import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Target, Plus, X, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  not_started: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  in_progress: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
};

const STATUS_ICONS = {
  not_started: Clock,
  in_progress: TrendingUp,
  completed: CheckCircle,
  cancelled: AlertCircle,
};

export default function PerformancePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', progress: 0, status: 'not_started' });
  const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';

  const fetchGoals = () => {
    api.get('/performance/goals/').then(res => { setGoals(res.data.results || res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/performance/goals/', form);
      toast.success('Goal created.');
      setShowForm(false);
      setForm({ title: '', description: '', start_date: '', end_date: '', progress: 0, status: 'not_started' });
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create goal.');
    } finally {
      setFormLoading(false);
    }
  };

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    avgProgress: goals.length ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length) : 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Performance</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Track goals and measure progress</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 text-xs font-medium text-white hover:opacity-90 transition-all duration-200 btn-press"
        >
          <Plus className="h-3.5 w-3.5" /> New Goal
        </button>
      </div>

      {/* Summary cards */}
      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-1">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Total Goals</p>
            <p className="text-xl font-semibold text-[hsl(var(--foreground))] mt-0.5 tracking-tight">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-2">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-semibold text-sky-600 mt-0.5 tracking-tight">{stats.inProgress}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-3">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Completed</p>
            <p className="text-xl font-semibold text-emerald-600 mt-0.5 tracking-tight">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-4">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Avg Progress</p>
            <p className="text-xl font-semibold text-[hsl(var(--primary))] mt-0.5 tracking-tight">{stats.avgProgress}%</p>
          </div>
        </div>
      )}

      {/* Goals table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto animate-slide-up delay-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
              {isAdmin && <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employee</th>}
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Goal</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Period</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Progress</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>
            )) : goals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No goals found. Create one to get started.
                </td>
              </tr>
            ) : goals.map(g => (
              <tr key={g.id} className="table-row-hover">
                {isAdmin && <td className="px-4 py-2.5 text-xs text-[hsl(var(--foreground))]">{g.employee_name}</td>}
                <td className="px-4 py-2.5">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))]">{g.title}</p>
                  {g.description && <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate max-w-xs mt-0.5">{g.description}</p>}
                </td>
                <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hidden md:table-cell whitespace-nowrap">{g.start_date} — {g.end_date}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-[hsl(var(--muted))]">
                      <div className="h-full rounded-full bg-[hsl(var(--primary))] animate-progress-fill" style={{ width: `${g.progress}%` }} />
                    </div>
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] tabular-nums">{g.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[g.status])}>
                    {g.status?.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop">
          <div className="w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg mx-4 modal-panel">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">New Goal</h2>
              <button onClick={() => setShowForm(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Title</label>
                <input
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                  className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 focus:border-[hsl(var(--ring))]"
                  placeholder="Goal title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 focus:border-[hsl(var(--ring))]"
                  placeholder="Brief description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required
                    className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required
                    className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="h-8 rounded-lg border border-[hsl(var(--border))] px-3 text-xs font-medium hover:bg-[hsl(var(--accent))] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="h-8 rounded-lg bg-[hsl(var(--primary))] px-4 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all btn-press">
                  {formLoading ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
