'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const TABS = [
  { key: 'blog', label: 'Blog', icon: '📝', table: 'blog_posts' },
  { key: 'career', label: 'Careers', icon: '🚀', table: 'career_posts' },
  { key: 'press', label: 'Press', icon: '📰', table: 'press_posts' },
  { key: 'announcement', label: 'Announcements', icon: '📢', table: 'announcements' },
];

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('blog');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', category: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadItems(); }, [activeTab]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms?type=${activeTab}&limit=50&all=true`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Created successfully' });
        setShowForm(false);
        setForm({ title: '', content: '', excerpt: '', category: '', status: 'draft' });
        loadItems();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handlePublish = async (id) => {
    try {
      await fetch('/api/cms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id, status: 'published' }),
      });
      loadItems();
    } catch (e) {}
  };

  const handleUnpublish = async (id) => {
    try {
      await fetch('/api/cms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id, status: 'draft' }),
      });
      loadItems();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await fetch('/api/cms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id }),
      });
      loadItems();
    } catch (e) {}
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Content Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage blog posts, careers, press releases and announcements.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create New
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
          <h3 className="font-bold text-ob-navy mb-4">New {TABS.find(t => t.key === activeTab)?.label?.slice(0, -1) || 'Item'}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
            <textarea rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Content..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none" />
            <div className="flex gap-4">
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Created</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={4} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : items.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400 text-sm">No {activeTab} posts yet. Click "Create New" to add one.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-ob-navy">{item.title}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.status === 'draft' ? (
                        <button onClick={() => handlePublish(item.id)} className="text-green-600 text-xs font-medium hover:underline">Publish</button>
                      ) : (
                        <button onClick={() => handleUnpublish(item.id)} className="text-amber-600 text-xs font-medium hover:underline">Unpublish</button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 text-xs font-medium hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
