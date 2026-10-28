import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CheckSquare, Plus, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = { low: 'text-zinc-500', medium: 'text-sky-600', high: 'text-amber-600', urgent: 'text-red-600' };
const STATUS_STYLES = { todo: 'bg-zinc-100 text-zinc-600', in_progress: 'bg-sky-50 text-sky-700', completed: 'bg-emerald-50 text-emerald-700' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/tasks/', { params }).then(res => { setTasks(res.data.results || res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try { await api.patch(`/tasks/${id}/`, { status: newStatus }); toast.success('Task updated.'); setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t)); }
    catch { toast.error('Failed to update.'); }
  };

  return (
    <div className="space-y-4">
      <div><h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Tasks</h1><p className="text-sm text-[hsl(var(--muted-foreground))]">Manage and track tasks</p></div>
      <div className="flex gap-1.5">
        {['', 'todo', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium', statusFilter === s ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]')}>
            {s ? s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Task</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Assigned To</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Priority</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Due Date</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Status</th>
        </tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">
          {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>)
          : tasks.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]"><CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />No tasks found.</td></tr>
          : tasks.map(t => (
            <tr key={t.id} className="hover:bg-[hsl(var(--accent))]/50">
              <td className="px-4 py-2">
                <p className="text-xs font-medium text-[hsl(var(--foreground))]">{t.title}</p>
                {t.is_overdue && <span className="text-[10px] text-red-600 flex items-center gap-0.5 mt-0.5"><AlertCircle className="h-3 w-3" />Overdue</span>}
              </td>
              <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">{t.assigned_to_name}</td>
              <td className="px-4 py-2"><span className={cn('text-xs font-medium capitalize', PRIORITY_STYLES[t.priority])}>{t.priority}</span></td>
              <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">{t.due_date || '—'}</td>
              <td className="px-4 py-2">
                <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                  className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium border-0 cursor-pointer', STATUS_STYLES[t.status])}>
                  <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
