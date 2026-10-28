import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Plus, Check, X, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  cancelled: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function LeavesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', total_days: 1, reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [reqRes, typesRes] = await Promise.all([
        api.get('/leaves/requests/', { params }),
        api.get('/leaves/types/'),
      ]);
      setRequests(reqRes.data.results || reqRes.data);
      setLeaveTypes(typesRes.data.results || typesRes.data);

      try {
        const balRes = await api.get('/leaves/requests/my_balances/');
        setBalances(balRes.data);
      } catch (e) { /* Employee might not have profile yet */ }
    } catch (err) {
      toast.error('Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leaves/requests/', form);
      toast.success('Leave request submitted.');
      setShowForm(false);
      setForm({ leave_type: '', start_date: '', end_date: '', total_days: 1, reason: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : (msg?.non_field_errors?.[0] || Object.values(msg || {})[0]?.[0] || 'Failed to submit.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/leaves/requests/${id}/approve/`);
      toast.success('Leave approved.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve.');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/leaves/requests/${id}/reject/`, { rejection_reason: rejectReason });
      toast.success('Leave rejected.');
      setRejectId(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject.');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.post(`/leaves/requests/${id}/cancel/`);
      toast.success('Leave request cancelled.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Leave Management</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage leave requests and balances</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-white hover:bg-[hsl(var(--primary))]/90"
        >
          <Plus className="h-3.5 w-3.5" /> Apply for Leave
        </button>
      </div>

      {/* Leave Balances */}
      {balances.length > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {balances.map(b => (
            <div key={b.id} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{b.leave_type_name}</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-semibold text-[hsl(var(--foreground))]">{b.remaining_days}</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">of {parseFloat(b.total_days) + parseFloat(b.carried_forward)} days</p>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-[hsl(var(--muted))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))]"
                  style={{ width: `${Math.min(100, (b.remaining_days / (parseFloat(b.total_days) + parseFloat(b.carried_forward) || 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1.5">
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === s
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
            )}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
              {isAdmin && <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employee</th>}
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Period</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Days</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Reason</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? (
              [...Array(4)].map((_, i) => <tr key={i}><td colSpan={isAdmin ? 7 : 6} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>)
            ) : requests.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" /> No leave requests found.
              </td></tr>
            ) : (
              requests.map(r => (
                <tr key={r.id} className="hover:bg-[hsl(var(--accent))]/50">
                  {isAdmin && <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">{r.employee_name}</td>}
                  <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">{r.leave_type_name}</td>
                  <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">{r.start_date} — {r.end_date}</td>
                  <td className="px-4 py-2 text-xs font-mono text-[hsl(var(--foreground))]">{r.total_days}</td>
                  <td className="px-4 py-2">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && r.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(r.id)} className="inline-flex h-6 w-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50" title="Approve">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setRejectId(r.id)} className="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50" title="Reject">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {r.status === 'pending' && !isAdmin && (
                        <button onClick={() => handleCancel(r.id)} className="text-xs text-[hsl(var(--destructive))] hover:underline">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg mx-4">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Leave Type *</label>
                <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))} required
                  className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs">
                  <option value="">Select type...</option>
                  {leaveTypes.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">End Date *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Total Days *</label>
                <input type="number" min="0.5" step="0.5" value={form.total_days} onChange={e => setForm(f => ({ ...f, total_days: e.target.value }))} required
                  className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Reason *</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required rows={3}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 py-1.5 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="h-8 rounded-md border border-[hsl(var(--border))] px-4 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="h-8 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-white disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg mx-4 p-5">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Rejection Reason</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Optional reason..."
              className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 py-1.5 text-xs mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="h-8 rounded-md border border-[hsl(var(--border))] px-4 text-xs font-medium">Cancel</button>
              <button onClick={() => handleReject(rejectId)} className="h-8 rounded-md bg-[hsl(var(--destructive))] px-4 text-xs font-medium text-white">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
