import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Search, Plus, Building2, Users, Edit2, Trash2, X,
  MoreHorizontal, ChevronDown,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [members, setMembers] = useState({});

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/departments/', { params: { search } });
      setDepartments(res.data.results || res.data);
    } catch (err) {
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const fetchMembers = async (deptId) => {
    if (members[deptId]) return;
    try {
      const res = await api.get(`/departments/${deptId}/members/`);
      setMembers(prev => ({ ...prev, [deptId]: res.data }));
    } catch (err) {
      // Ignore
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchMembers(id);
    }
  };

  const openCreate = () => {
    setEditDept(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (dept) => {
    setEditDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    try {
      if (editDept) {
        await api.patch(`/departments/${editDept.id}/`, formData);
        toast.success('Department updated.');
      } else {
        await api.post('/departments/', formData);
        toast.success('Department created.');
      }
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      const data = err.response?.data;
      if (data) setFormErrors(data);
      toast.error('Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/departments/${dept.id}/`);
      toast.success('Department deleted.');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot delete department.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">Departments</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {departments.length} department{departments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-white hover:bg-[hsl(var(--primary))]/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search departments..."
          className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-8 pr-3 text-xs placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
        />
      </div>

      {/* Department Cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-16">
          <Building2 className="h-10 w-10 text-[hsl(var(--muted-foreground))] opacity-40 mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No departments found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {departments.map(dept => (
            <div key={dept.id} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => toggleExpand(dept.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{dept.name}</p>
                    <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {dept.employee_count} employee{dept.employee_count !== 1 ? 's' : ''}
                      </span>
                      {dept.head_name && <span>Head: {dept.head_name}</span>}
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    'h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform',
                    expandedId === dept.id && 'rotate-180'
                  )} />
                </button>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openEdit(dept)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-[hsl(var(--destructive))]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded members list */}
              {expandedId === dept.id && (
                <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30">
                  {dept.description && (
                    <p className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                      {dept.description}
                    </p>
                  )}
                  {!members[dept.id] ? (
                    <div className="px-4 py-4 text-center">
                      <div className="h-4 w-4 mx-auto animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
                    </div>
                  ) : members[dept.id].length === 0 ? (
                    <p className="px-4 py-4 text-center text-xs text-[hsl(var(--muted-foreground))]">No active members.</p>
                  ) : (
                    <div className="divide-y divide-[hsl(var(--border))]">
                      {members[dept.id].map(emp => (
                        <div key={emp.id} className="flex items-center gap-2.5 px-4 py-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                            <span className="text-[9px] font-medium">
                              {emp.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-xs text-[hsl(var(--foreground))] truncate">{emp.full_name}</span>
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{emp.designation_title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg mx-4">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {editDept ? 'Edit Department' : 'Add Department'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Name <span className="text-[hsl(var(--destructive))]">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                  required
                />
                {formErrors.name && <p className="mt-0.5 text-[11px] text-[hsl(var(--destructive))]">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] min-h-[60px]"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="h-8 rounded-md border border-[hsl(var(--border))] px-4 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]">Cancel</button>
                <button type="submit" disabled={saving} className="h-8 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-white hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50">
                  {saving ? 'Saving...' : editDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
