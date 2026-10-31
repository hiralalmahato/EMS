import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import {
  Building2,
  Clock,
  Calendar,
  Lock,
  Loader2,
  Save,
} from 'lucide-react';

const TABS = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'schedules', label: 'Work Schedules', icon: Clock },
  { key: 'holidays', label: 'Holidays', icon: Calendar },
  { key: 'security', label: 'Security', icon: Lock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Settings</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          Manage company configuration and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'company' && <CompanyTab />}
          {activeTab === 'schedules' && <SchedulesTab />}
          {activeTab === 'holidays' && <HolidaysTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function CompanyTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/core/settings/');
        setSettings(res.data);
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch('/core/settings/', settings);
      setSettings(res.data);
      toast.success('Company settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!settings) return null;

  const fields = [
    { key: 'company_name', label: 'Company Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'website', label: 'Website', type: 'url' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'zip_code', label: 'ZIP Code', type: 'text' },
    { key: 'currency', label: 'Currency Code', type: 'text' },
    { key: 'currency_symbol', label: 'Currency Symbol', type: 'text' },
    { key: 'date_format', label: 'Date Format', type: 'text' },
  ];

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="border-b border-[hsl(var(--border))] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Company Information</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Basic company details and preferences</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={settings[f.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-none"
                />
              ) : (
                <input
                  type={f.type}
                  value={settings[f.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/core/work-schedules/');
        setSchedules(res.data.results || res.data || []);
      } catch {
        toast.error('Failed to load schedules');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="border-b border-[hsl(var(--border))] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Work Schedules</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Defined work schedule templates</p>
      </div>
      <div className="p-5">
        {schedules.length === 0 ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">No schedules configured</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="rounded-md border border-[hsl(var(--border))] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">{s.name}</h3>
                    {s.is_default && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <div>
                    <span className="text-[hsl(var(--foreground))] font-medium">Hours:</span> {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                  </div>
                  <div>
                    <span className="text-[hsl(var(--foreground))] font-medium">Grace:</span> {s.grace_period_minutes} min
                  </div>
                  <div>
                    <span className="text-[hsl(var(--foreground))] font-medium">Days:</span>{' '}
                    {(s.working_days || []).map((d) => dayNames[d]).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HolidaysTab() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/core/holidays/');
        setHolidays(res.data.results || res.data || []);
      } catch {
        toast.error('Failed to load holidays');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="border-b border-[hsl(var(--border))] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Holidays</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Company holidays for the current year</p>
      </div>
      <div className="p-5">
        {holidays.length === 0 ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">No holidays configured</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Holiday</th>
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Date</th>
                  <th className="pb-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {holidays.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2.5 text-xs text-[hsl(var(--foreground))] font-medium">{h.name}</td>
                    <td className="py-2.5 text-xs text-[hsl(var(--muted-foreground))]">
                      {h.date ? new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2.5">
                      <span className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                        h.is_optional ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      )}>
                        {h.is_optional ? 'Optional' : 'Mandatory'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      setSaving(true);
      await api.post('/auth/change-password/', {
        old_password: form.old_password,
        new_password: form.new_password,
      });
      toast.success('Password changed successfully');
      setForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const detail = err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to change password';
      toast.error(detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="border-b border-[hsl(var(--border))] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Change Password</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Update your account password</p>
      </div>
      <form onSubmit={handleChangePassword} className="p-5 space-y-4 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Current Password</label>
          <input
            type="password"
            value={form.old_password}
            onChange={(e) => setForm({ ...form, old_password: e.target.value })}
            required
            className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">New Password</label>
          <input
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            required
            className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Confirm New Password</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            required
            className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
          Update Password
        </button>
      </form>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
    </div>
  );
}
