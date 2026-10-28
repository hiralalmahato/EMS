import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Building2,
  Briefcase, User, Shield, Clock,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal' },
  { key: 'employment', label: 'Employment' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  on_leave: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  inactive: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-[hsl(var(--muted-foreground))]" />
      <div>
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</p>
        <p className="text-sm text-[hsl(var(--foreground))]">{value}</p>
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employees/${id}/`);
        setEmployee(res.data);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[hsl(var(--muted))]" />
        <div className="h-40 animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-64 animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Employee not found.</p>
        <Link to="/employees" className="mt-2 text-sm text-[hsl(var(--primary))] hover:underline">Back to Employees</Link>
      </div>
    );
  }

  const e = employee;
  const initials = e.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Employees
      </Link>

      {/* Profile Header */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
            <span className="text-xl font-semibold">{initials}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">{e.full_name}</h1>
              <span className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                STATUS_STYLES[e.status]
              )}>
                {e.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {e.designation_title || 'No designation'} · {e.department_name || 'No department'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>
              {e.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.phone}</span>}
              <span className="flex items-center gap-1 font-mono"><Shield className="h-3 w-3" /> {e.employee_id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-[hsl(var(--border))]">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              tab === t.key
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        {tab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Contact</h3>
              <div className="space-y-0.5">
                <InfoRow icon={Mail} label="Work Email" value={e.email} />
                {e.personal_email && <InfoRow icon={Mail} label="Personal Email" value={e.personal_email} />}
                <InfoRow icon={Phone} label="Phone" value={e.phone} />
                <InfoRow icon={MapPin} label="Location" value={[e.city, e.state, e.country].filter(Boolean).join(', ') || null} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Employment</h3>
              <div className="space-y-0.5">
                <InfoRow icon={Building2} label="Department" value={e.department_name} />
                <InfoRow icon={Briefcase} label="Designation" value={e.designation_title} />
                <InfoRow icon={User} label="Reporting Manager" value={e.manager_name} />
                <InfoRow icon={Calendar} label="Joining Date" value={e.joining_date} />
                <InfoRow icon={Clock} label="Employment Type" value={e.employment_type?.replace('_', ' ')} />
              </div>
            </div>
          </div>
        )}

        {tab === 'personal' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Personal Information</h3>
              <div className="space-y-0.5">
                <InfoRow icon={Calendar} label="Date of Birth" value={e.date_of_birth} />
                <InfoRow icon={User} label="Gender" value={e.gender?.replace('_', ' ')} />
                <InfoRow icon={User} label="Marital Status" value={e.marital_status} />
                <InfoRow icon={User} label="Nationality" value={e.nationality} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Address</h3>
              <div className="space-y-0.5">
                {e.address_line1 && <InfoRow icon={MapPin} label="Address" value={[e.address_line1, e.address_line2].filter(Boolean).join(', ')} />}
                <InfoRow icon={MapPin} label="City" value={e.city} />
                <InfoRow icon={MapPin} label="State" value={e.state} />
                <InfoRow icon={MapPin} label="Country" value={e.country} />
                <InfoRow icon={MapPin} label="Zip Code" value={e.zip_code} />
              </div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 mt-6">Emergency Contact</h3>
              <div className="space-y-0.5">
                <InfoRow icon={User} label="Name" value={e.emergency_contact_name} />
                <InfoRow icon={Phone} label="Phone" value={e.emergency_contact_phone} />
                <InfoRow icon={User} label="Relation" value={e.emergency_contact_relation} />
              </div>
            </div>
          </div>
        )}

        {tab === 'employment' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Employment Details</h3>
              <div className="space-y-0.5">
                <InfoRow icon={Shield} label="Employee ID" value={e.employee_id} />
                <InfoRow icon={Building2} label="Department" value={e.department_name} />
                <InfoRow icon={Briefcase} label="Designation" value={e.designation_title} />
                <InfoRow icon={User} label="Reporting Manager" value={e.manager_name} />
                <InfoRow icon={Clock} label="Employment Type" value={e.employment_type?.replace('_', ' ')} />
                <InfoRow icon={Calendar} label="Joining Date" value={e.joining_date} />
                <InfoRow icon={Calendar} label="Probation End" value={e.probation_end_date} />
                <InfoRow icon={Calendar} label="Confirmation Date" value={e.confirmation_date} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Skills</h3>
              {e.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {e.skills.map((skill, i) => (
                    <span key={i} className="rounded-full bg-[hsl(var(--secondary))] px-2.5 py-0.5 text-xs text-[hsl(var(--foreground))]">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">No skills listed.</p>
              )}
              {e.notes && (
                <>
                  <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 mt-6">Notes</h3>
                  <p className="text-sm text-[hsl(var(--foreground))]">{e.notes}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
