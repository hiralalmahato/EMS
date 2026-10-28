import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Briefcase, Plus, Users, MapPin, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STAGE_STYLES = {
  applied: 'bg-zinc-100 text-zinc-600', screening: 'bg-sky-50 text-sky-700',
  interview: 'bg-amber-50 text-amber-700', offered: 'bg-violet-50 text-violet-700',
  hired: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-600',
};

export default function RecruitmentPage() {
  const [openings, setOpenings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('openings');

  useEffect(() => {
    Promise.all([
      api.get('/recruitment/openings/'),
      api.get('/recruitment/candidates/'),
    ]).then(([o, c]) => {
      setOpenings(o.data.results || o.data);
      setCandidates(c.data.results || c.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Recruitment</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Job openings and candidates</p></div>
      </div>
      <div className="flex gap-1.5">
        {['openings', 'candidates'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium capitalize', tab === t ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]')}>{t}</button>
        ))}
      </div>
      {tab === 'openings' ? (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Title</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Department</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Positions</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Candidates</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Status</th>
          </tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>)
            : openings.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]"><Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />No openings found.</td></tr>
            : openings.map(o => (
              <tr key={o.id} className="hover:bg-[hsl(var(--accent))]/50">
                <td className="px-4 py-2 text-xs font-medium text-[hsl(var(--foreground))]">{o.title}</td>
                <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">{o.department_name}</td>
                <td className="px-4 py-2 text-xs">{o.positions}</td>
                <td className="px-4 py-2 text-xs">{o.candidate_count}</td>
                <td className="px-4 py-2"><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', o.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600')}>{o.status}</span></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      ) : (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Candidate</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Position</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Stage</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Applied</th>
          </tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">
            {candidates.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No candidates yet.</td></tr>
            : candidates.map(c => (
              <tr key={c.id}><td className="px-4 py-2 text-xs font-medium">{c.name}</td>
                <td className="px-4 py-2 text-xs">{c.job_title}</td>
                <td className="px-4 py-2"><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STAGE_STYLES[c.stage])}>{c.stage}</span></td>
                <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">{c.application_date}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
