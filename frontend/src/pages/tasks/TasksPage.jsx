import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Plus, X, AlertTriangle, Clock, CheckCircle, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  in_progress: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
};

const PRIORITY_STYLES = {
  low: 'text-zinc-500',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  const fetchTasks = () => {
    const params = filter !== 'all' ? { status: filter } : {};
    api.get('/tasks/', { params })
      .then(res => setTasks(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); fetchTasks(); }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/tasks/${id}/`, { status });
      toast.success('Status updated.');
      fetchTasks();
    } catch {
      toast.error('Failed to update.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/tasks/', form);
      toast.success('Task created.');
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setFormLoading(false);
    }
  };

  const isOverdue = (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Tasks</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{stats.total} task{stats.total !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 text-xs font-medium text-white hover:opacity-90 transition-all duration-200 btn-press">
            <Plus className="h-3.5 w-3.5" /> New Task
          </button>
        )}
      </div>

      {/* Summary */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-1">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Total</p>
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
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-semibold text-red-600 mt-0.5 tracking-tight">{stats.overdue}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 animate-slide-up delay-2">
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200',
            filter === f ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
          )}>{f.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Tasks table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto animate-slide-up delay-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Task</th>
              {isAdmin && <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Assigned To</th>}
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Priority</th>
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
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No tasks found.
                </td>
              </tr>
            ) : tasks.map(t => (
              <tr key={t.id} className={cn('table-row-hover', isOverdue(t) && 'bg-red-50/30 dark:bg-red-950/10')}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {isOverdue(t) && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                    <div>
                      <p className="text-xs font-medium text-[hsl(var(--foreground))]">{t.title}</p>
                      {t.description && <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate max-w-xs mt-0.5">{t.description}</p>}
                    </div>
                  </div>
                </td>
                {isAdmin && <td className="px-4 py-2.5 text-xs text-[hsl(var(--foreground))] hidden md:table-cell">{t.assigned_to_name}</td>}
                <td className="px-4 py-2.5">
                  <span className={cn('text-xs font-medium capitalize', PRIORITY_STYLES[t.priority])}>{t.priority}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hidden sm:table-cell whitespace-nowrap">{t.due_date || '—'}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize border-0 cursor-pointer focus:ring-1 focus:ring-[hsl(var(--ring))]',
                      STATUS_STYLES[t.status]
                    )}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop">
          <div className="w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg mx-4 modal-panel">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">New Task</h2>
              <button onClick={() => setShowForm(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                  className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 focus:border-[hsl(var(--ring))]"
                  placeholder="Task title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30"
                  placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="h-8 rounded-lg border border-[hsl(var(--border))] px-3 text-xs font-medium hover:bg-[hsl(var(--accent))] transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className="h-8 rounded-lg bg-[hsl(var(--primary))] px-4 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all btn-press">
                  {formLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
