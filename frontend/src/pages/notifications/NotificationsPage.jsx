import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Bell,
  Check,
  CheckCheck,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Megaphone,
  Info,
  Loader2,
  Inbox,
} from 'lucide-react';

const ICON_MAP = {
  leave_submitted: CalendarDays,
  leave_approved: CalendarDays,
  leave_rejected: CalendarDays,
  task_assigned: ClipboardList,
  task_completed: ClipboardList,
  announcement: Megaphone,
  payslip: DollarSign,
  general: Info,
};

const COLOR_MAP = {
  leave_submitted: 'text-amber-500 bg-amber-50',
  leave_approved: 'text-emerald-600 bg-emerald-50',
  leave_rejected: 'text-red-500 bg-red-50',
  task_assigned: 'text-blue-500 bg-blue-50',
  task_completed: 'text-emerald-600 bg-emerald-50',
  announcement: 'text-purple-500 bg-purple-50',
  payslip: 'text-teal-600 bg-teal-50',
  general: 'text-slate-500 bg-slate-50',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || res.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/mark_read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 rounded-md bg-[hsl(var(--secondary))] p-0.5 w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-medium transition-colors',
              filter === tab.key
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[hsl(var(--secondary))] p-4 mb-3">
            <Inbox className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {filter === 'unread'
              ? 'All caught up! Switch to "All" to see past notifications.'
              : 'Notifications about leave requests, tasks, and announcements will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
          {filtered.map((notif) => {
            const IconComp = ICON_MAP[notif.notification_type] || Info;
            const colorClass = COLOR_MAP[notif.notification_type] || COLOR_MAP.general;

            return (
              <div
                key={notif.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 transition-colors',
                  !notif.is_read && 'bg-[hsl(var(--primary))]/[0.02]'
                )}
              >
                {/* Icon */}
                <div className={cn('mt-0.5 rounded-lg p-2 shrink-0', colorClass)}>
                  <IconComp className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-[13px] leading-snug',
                        notif.is_read
                          ? 'text-[hsl(var(--muted-foreground))]'
                          : 'text-[hsl(var(--foreground))] font-medium'
                      )}
                    >
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]/70 mt-1">
                    {notif.created_at
                      ? format(new Date(notif.created_at), 'MMM d, yyyy · h:mm a')
                      : ''}
                  </p>
                </div>

                {/* Action */}
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="shrink-0 rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
