import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserPlus } from 'lucide-react';
import { cn } from '../../utils/cn';

const STATUS_STYLES = { pending: 'bg-zinc-100 text-zinc-600', in_progress: 'bg-sky-50 text-sky-700', completed: 'bg-emerald-50 text-emerald-700', skipped: 'bg-amber-50 text-amber-600' };

export default function OnboardingPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/onboarding/tasks/').then(r => { setTasks(r.data.results || r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div><h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Onboarding</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Track employee onboarding progress</p></div>
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Employee</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Task</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Category</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Due Date</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Status</th>
        </tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">
          {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>)
          : tasks.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]"><UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />No onboarding tasks found.</td></tr>
          : tasks.map(t => (
            <tr key={t.id} className="hover:bg-[hsl(var(--accent))]/50">
              <td className="px-4 py-2 text-xs font-medium">{t.employee_name}</td>
              <td className="px-4 py-2 text-xs">{t.title}</td>
              <td className="px-4 py-2 text-xs capitalize text-[hsl(var(--muted-foreground))]">{t.category}</td>
              <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">{t.due_date || '—'}</td>
              <td className="px-4 py-2"><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[t.status])}>{t.status?.replace('_', ' ')}</span></td>
            </tr>))}
        </tbody></table>
      </div>
    </div>
  );
}
