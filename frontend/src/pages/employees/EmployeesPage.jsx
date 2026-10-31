import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Plus, Filter, Download, ChevronLeft, ChevronRight,
  MoreHorizontal, Eye, Edit2, UserX, UserCheck, X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import EmployeeFormModal from './EmployeeFormModal';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  on_leave: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  inactive: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const TYPE_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    employment_type: '',
  });
  const [departments, setDepartments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  const canManage = user?.role === 'admin' || user?.role === 'hr_manager';

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, search };
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;
      if (filters.employment_type) params.employment_type = filters.employment_type;

      const res = await api.get('/employees/', { params });
      setEmployees(res.data.results || res.data);
      setTotalCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments/', { params: { page_size: 100 } });
        setDepartments(res.data.results || res.data);
      } catch (e) {
        // Ignore
      }
    };
    if (canManage) fetchDepts();
  }, [canManage]);

  useEffect(() => {
    if (searchParams.get('action') === 'add' && canManage) {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canManage, setSearchParams]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ department: '', status: '', employment_type: '' });
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = filters.department || filters.status || filters.employment_type || search;

  const handleExport = async () => {
    try {
      const res = await api.get('/employees/export_csv/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded.');
    } catch (err) {
      toast.error('Export failed.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      await api.post(`/employees/${id}/deactivate/`);
      toast.success('Employee deactivated.');
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to deactivate.');
    }
    setActionMenuId(null);
  };

  const handleReactivate = async (id) => {
    try {
      await api.post(`/employees/${id}/reactivate/`);
      toast.success('Employee reactivated.');
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to reactivate.');
    }
    setActionMenuId(null);
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Employees</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {totalCount} employee{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={handleExport}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-3 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button
                onClick={() => { setEditingEmployee(null); setShowForm(true); }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 text-xs font-medium text-white hover:opacity-90 transition-all duration-200 btn-press"
              >
                <Plus className="h-3.5 w-3.5" /> Add Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, ID, or email..."
            className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-8 pr-3 text-xs placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium',
            hasActiveFilters
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
              : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
          )}
        >
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="h-7 rounded border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--foreground))]"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-7 rounded border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--foreground))]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filters.employment_type}
            onChange={(e) => handleFilterChange('employment_type', e.target.value)}
            className="h-7 rounded border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--foreground))]"
          >
            <option value="">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-slide-up delay-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Employee</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">ID</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden lg:table-cell">Department</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden lg:table-cell">Designation</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden sm:table-cell">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
              {canManage && <th className="px-4 py-2.5 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="table-row-hover">
                  <td className="px-4 py-2.5">
                    <Link to={`/employees/${emp.id}`} className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                        <span className="text-[11px] font-medium">
                          {emp.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate hover:text-[hsl(var(--primary))]">{emp.full_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{emp.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hidden md:table-cell font-mono">{emp.employee_id}</td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--foreground))] hidden lg:table-cell">{emp.department_name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--foreground))] hidden lg:table-cell">{emp.designation_title || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-[hsl(var(--foreground))] hidden sm:table-cell">{TYPE_LABELS[emp.employment_type] || emp.employment_type}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                      STATUS_STYLES[emp.status] || 'bg-zinc-100 text-zinc-600'
                    )}>
                      {emp.status?.replace('_', ' ')}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === emp.id ? null : emp.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {actionMenuId === emp.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
                            <div className="dropdown-menu absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-lg">
                              <Link
                                to={`/employees/${emp.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
                                onClick={() => setActionMenuId(null)}
                              >
                                <Eye className="h-3 w-3" /> View Profile
                              </Link>
                              <button
                                onClick={() => { setEditingEmployee(emp); setShowForm(true); setActionMenuId(null); }}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
                              >
                                <Edit2 className="h-3 w-3" /> Edit
                              </button>
                              {emp.status === 'active' ? (
                                <button
                                  onClick={() => handleDeactivate(emp.id)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[hsl(var(--destructive))] hover:bg-[hsl(var(--accent))]"
                                >
                                  <UserX className="h-3 w-3" /> Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(emp.id)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-[hsl(var(--accent))]"
                                >
                                  <UserCheck className="h-3 w-3" /> Reactivate
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))] disabled:opacity-40 hover:bg-[hsl(var(--accent))]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))] disabled:opacity-40 hover:bg-[hsl(var(--accent))]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          onClose={() => { setShowForm(false); setEditingEmployee(null); }}
          onSaved={() => { setShowForm(false); setEditingEmployee(null); fetchEmployees(); }}
        />
      )}
    </div>
  );
}
