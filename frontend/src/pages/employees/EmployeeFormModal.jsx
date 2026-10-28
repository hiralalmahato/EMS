import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function EmployeeFormModal({ employee, departments, onClose, onSaved }) {
  const isEdit = !!employee;
  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [form, setForm] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employment_type: 'full_time',
    joining_date: '',
    status: 'active',
    basic_salary: '',
    date_of_birth: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      setForm({
        employee_id: employee.employee_id || '',
        first_name: employee.first_name || employee.full_name?.split(' ')[0] || '',
        last_name: employee.last_name || employee.full_name?.split(' ').slice(1).join(' ') || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        employment_type: employee.employment_type || 'full_time',
        joining_date: employee.joining_date || '',
        status: employee.status || 'active',
        basic_salary: employee.basic_salary || '',
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || '',
      });
    }
  }, [employee, isEdit]);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const params = form.department ? { department: form.department } : {};
        const res = await api.get('/designations/', { params: { ...params, page_size: 100 } });
        setDesignations(res.data.results || res.data);
      } catch (e) {
        // Ignore
      }
    };
    fetchDesignations();
  }, [form.department]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = { ...form };
      if (!payload.department) delete payload.department;
      if (!payload.designation) delete payload.designation;
      if (!payload.basic_salary) delete payload.basic_salary;
      if (!payload.date_of_birth) delete payload.date_of_birth;
      if (!payload.gender) delete payload.gender;

      if (isEdit) {
        await api.patch(`/employees/${employee.id}/`, payload);
        toast.success('Employee updated.');
      } else {
        await api.post('/employees/', payload);
        toast.success('Employee created.');
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
        const firstErr = Object.values(data)[0];
        toast.error(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
      } else {
        toast.error('An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, type = 'text', required, children }) => (
    <div>
      <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">
        {label} {required && <span className="text-[hsl(var(--destructive))]">*</span>}
      </label>
      {children || (
        <input
          type={type}
          value={form[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          required={required}
        />
      )}
      {errors[field] && (
        <p className="mt-0.5 text-[11px] text-[hsl(var(--destructive))]">
          {Array.isArray(errors[field]) ? errors[field][0] : errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-10 overflow-y-auto">
      <div className="w-full max-w-lg rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg mx-4 mb-10">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            {isEdit ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" field="first_name" required />
            <Field label="Last Name" field="last_name" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee ID" field="employee_id" required />
            <Field label="Email" field="email" type="email" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" field="phone" />
            <Field label="Date of Birth" field="date_of_birth" type="date" />
          </div>

          <Field label="Gender" field="gender">
            <select
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))]"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>

          {/* Employment */}
          <div className="border-t border-[hsl(var(--border))] pt-4 mt-4">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Employment Details</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" field="department">
              <select
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))]"
              >
                <option value="">Select...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Designation" field="designation">
              <select
                value={form.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))]"
              >
                <option value="">Select...</option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employment Type" field="employment_type">
              <select
                value={form.employment_type}
                onChange={(e) => handleChange('employment_type', e.target.value)}
                className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))]"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </Field>
            <Field label="Joining Date" field="joining_date" type="date" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" field="status">
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="h-8 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--foreground))]"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Basic Salary" field="basic_salary" type="number" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--border))] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md border border-[hsl(var(--border))] px-4 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-8 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-white hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
