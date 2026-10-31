import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Plus, FileText, Download } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  processed: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
};

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

export default function PayrollPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee: '', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(),
    basic_salary: '', allowances: 0, bonuses: 0, deductions: 0, notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/records/');
      setRecords(res.data.results || res.data);
      if (isAdmin) {
        const empRes = await api.get('/employees/', { params: { status: 'active', page_size: 100 } });
        setEmployees(empRes.data.results || empRes.data);
      }
    } catch (err) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/payroll/records/', form);
      toast.success('Payroll record created.');
      setShowForm(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : (msg?.non_field_errors?.[0] || Object.values(msg || {})[0]?.[0] || 'Failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (id) => {
    try { await api.post(`/payroll/records/${id}/process/`); toast.success('Payroll processed.'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed.'); }
  };

  const handleMarkPaid = async (id) => {
    try { await api.post(`/payroll/records/${id}/mark_paid/`); toast.success('Marked as paid.'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed.'); }
  };

  const handleSelectEmployee = (empId) => {
    const emp = employees.find(e => String(e.id) === String(empId));
    setForm(f => ({ ...f, employee: empId, basic_salary: emp?.basic_salary || '' }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Payroll</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {isAdmin ? 'Manage payroll records and processing' : 'Your payslips'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-white hover:opacity-90 transition-all duration-200 btn-press">
            <Plus className="h-3.5 w-3.5" /> Create Payroll
          </button>
        )}
      </div>

      {/* Records Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Period</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Basic</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Allowances</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">Deductions</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Net Pay</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
              {isAdmin && <th className="px-4 py-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}><td colSpan={isAdmin ? 8 : 7} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[hsl(var(--muted))]" /></td></tr>)
            ) : records.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" /> No payroll records found.
              </td></tr>
            ) : (
              records.map(r => (
                <tr key={r.id} className="hover:bg-[hsl(var(--accent))]/50">
                  <td className="px-4 py-2">
                    <p className="text-xs font-medium text-[hsl(var(--foreground))]">{r.employee_name}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">{r.employee_id_display}</p>
                  </td>
                  <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))]">{r.period_display}</td>
                  <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))] text-right font-mono">{formatCurrency(r.basic_salary)}</td>
                  <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))] text-right font-mono hidden md:table-cell">{formatCurrency(r.allowances)}</td>
                  <td className="px-4 py-2 text-xs text-red-600 text-right font-mono hidden md:table-cell">-{formatCurrency(r.deductions)}</td>
                  <td className="px-4 py-2 text-xs text-[hsl(var(--foreground))] text-right font-semibold font-mono">{formatCurrency(r.net_salary)}</td>
                  <td className="px-4 py-2">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-right">
                      {r.status === 'draft' && (
                        <button onClick={() => handleProcess(r.id)} className="text-xs text-[hsl(var(--primary))] hover:underline">Process</button>
                      )}
                      {r.status === 'processed' && (
                        <button onClick={() => handleMarkPaid(r.id)} className="text-xs text-emerald-600 hover:underline">Mark Paid</button>
                      )}
                      {r.status === 'paid' && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          <FileText className="h-3 w-3 inline" /> Paid
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Payroll Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop">
          <div className="w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg modal-panel mx-4">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Create Payroll Record</h2>
              <button onClick={() => setShowForm(false)} className="text-[hsl(var(--muted-foreground))]">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Employee *</label>
                <select value={form.employee} onChange={e => handleSelectEmployee(e.target.value)} required
                  className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs">
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Month *</label>
                  <select value={form.period_month} onChange={e => setForm(f => ({ ...f, period_month: parseInt(e.target.value) }))}
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs">
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Year *</label>
                  <input type="number" value={form.period_year} onChange={e => setForm(f => ({ ...f, period_year: parseInt(e.target.value) }))} required
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Basic Salary *</label>
                  <input type="number" step="0.01" value={form.basic_salary} onChange={e => setForm(f => ({ ...f, basic_salary: e.target.value }))} required
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" /></div>
                <div><label className="block text-xs font-medium mb-1">Allowances</label>
                  <input type="number" step="0.01" value={form.allowances} onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))}
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Bonuses</label>
                  <input type="number" step="0.01" value={form.bonuses} onChange={e => setForm(f => ({ ...f, bonuses: e.target.value }))}
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" /></div>
                <div><label className="block text-xs font-medium mb-1">Deductions</label>
                  <input type="number" step="0.01" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))}
                    className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="h-8 rounded-md border border-[hsl(var(--border))] px-4 text-xs font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="h-8 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-white disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
