import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Briefcase, Plus, Users, MapPin, X, Mail, Phone, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STAGE_STYLES = {
  applied: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  screening: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  interview: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  offered: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  hired: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rejected: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
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

  const stats = {
    openPositions: openings.filter(o => o.status === 'open').length,
    totalCandidates: candidates.length,
    inInterview: candidates.filter(c => c.stage === 'interview').length,
    hired: candidates.filter(c => c.stage === 'hired').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Recruitment</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Job openings and candidate pipeline</p>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-1">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Open Positions</p>
            <p className="text-xl font-semibold text-[hsl(var(--primary))] mt-0.5 tracking-tight">{stats.openPositions}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-2">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Total Candidates</p>
            <p className="text-xl font-semibold text-[hsl(var(--foreground))] mt-0.5 tracking-tight">{stats.totalCandidates}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-3">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">In Interview</p>
            <p className="text-xl font-semibold text-amber-600 mt-0.5 tracking-tight">{stats.inInterview}</p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 card-hover animate-slide-up delay-4">
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Hired</p>
            <p className="text-xl font-semibold text-emerald-600 mt-0.5 tracking-tight">{stats.hired}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 animate-slide-up delay-2">
        {['openings', 'candidates'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200',
            tab === t ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
          )}>{t}</button>
        ))}
      </div>

      {tab === 'openings' ? (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto animate-slide-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Positions</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Candidates</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {loading ? [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>
              )) : openings.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />No openings found.
                </td></tr>
              ) : openings.map(o => (
                <tr key={o.id} className="table-row-hover">
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium text-[hsl(var(--foreground))]">{o.title}</p>
                    {o.location && <p className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{o.location}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hidden md:table-cell">{o.department_name}</td>
                  <td className="px-4 py-2.5 text-xs tabular-nums">{o.positions}</td>
                  <td className="px-4 py-2.5 text-xs tabular-nums">{o.candidate_count}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', o.status === 'open' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400')}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto animate-slide-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Position</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Stage</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden sm:table-cell">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {candidates.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />No candidates yet.
                </td></tr>
              ) : candidates.map(c => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium text-[hsl(var(--foreground))]">{c.name}</p>
                    {c.email && <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate max-w-xs">{c.email}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--foreground))] hidden md:table-cell">{c.job_title}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STAGE_STYLES[c.stage])}>{c.stage}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hidden sm:table-cell whitespace-nowrap">{c.application_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
