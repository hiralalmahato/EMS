import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Megaphone,
  Plus,
  X,
  Loader2,
  Calendar,
  User,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user, hasRole } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', is_published: true });

  const isManager = hasRole(['admin', 'hr_manager']);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements/');
      setAnnouncements(res.data.results || res.data || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const resetForm = () => {
    setForm({ title: '', content: '', is_published: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      if (editingId) {
        await api.patch(`/announcements/${editingId}/`, form);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements/', form);
        toast.success('Announcement published');
      }
      resetForm();
      fetchAnnouncements();
    } catch {
      toast.error('Failed to save announcement');
    }
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content, is_published: ann.is_published });
    setEditingId(ann.id);
    setShowForm(true);
    setViewingAnnouncement(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}/`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))] tracking-tight">Announcements</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Company-wide updates and notices
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            New Announcement
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop">
          <div className="w-full max-w-lg rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg modal-panel">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3.5">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={resetForm} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-none"
                  placeholder="Write your announcement..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))]">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="rounded border-[hsl(var(--input))]"
                />
                Publish immediately
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  {editingId ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop">
          <div className="w-full max-w-lg rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg modal-panel">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3.5">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">{viewingAnnouncement.title}</h2>
              <button onClick={() => setViewingAnnouncement(null)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {viewingAnnouncement.author_name || 'Admin'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {viewingAnnouncement.publish_date
                    ? format(new Date(viewingAnnouncement.publish_date), 'MMM d, yyyy')
                    : ''}
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap leading-relaxed">
                {viewingAnnouncement.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[hsl(var(--secondary))] p-4 mb-3">
            <Megaphone className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">No announcements</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Company-wide updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">{ann.title}</h3>
                    {!ann.is_published && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-600">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-2">
                    {ann.content}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-[hsl(var(--muted-foreground))]">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ann.author_name || 'Admin'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {ann.publish_date ? format(new Date(ann.publish_date), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setViewingAnnouncement(ann)}
                    className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  {isManager && (
                    <>
                      <button
                        onClick={() => handleEdit(ann)}
                        className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
