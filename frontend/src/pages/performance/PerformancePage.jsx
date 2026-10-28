import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Target, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  not_started: 'bg-zinc-100 text-zinc-600',
  in_progress: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
};

export default function PerformancePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';

  useEffect(() => {
    api.get('/performance/goals/').then(res => { setGoals(res.data.results || res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Performance</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Goals and reviews</p></div>
      </div>
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
            {isAdmin && <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Employee</th>}
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Goal</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Period</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Progress</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>)
            : goals.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]"><Target className="h-8 w-8 mx-auto mb-2 opacity-40" />No goals found.</td></tr>
            : goals.map(g => (
              <tr key={g.id} className="hover:bg-[hsl(var(--accent))]/50">
                {isAdmin && <td className="px-4 py-2 text-xs">{g.employee_name}</td>}
                <td className="px-4 py-2 text-xs font-medium text-[hsl(var(--foreground))]">{g.title}</td>
                <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">{g.start_date} — {g.end_date}</td>
                <td className="px-4 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${g.progress}%` }} /></div><span className="text-[11px] text-[hsl(var(--muted-foreground))]">{g.progress}%</span></div></td>
                <td className="px-4 py-2"><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[g.status])}>{g.status?.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
