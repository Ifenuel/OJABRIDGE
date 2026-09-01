'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const TABS = [
  { key: 'blog', label: 'Blog', icon: '📝', table: 'blog_posts' },
  { key: 'career', label: 'Careers', icon: '🚀', table: 'career_posts' },
  { key: 'press', label: 'Press', icon: '📰', table: 'press_posts' },
  { key: 'announcement', label: 'Announcements', icon: '📢', table: 'announcements' },
];

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('blog');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', category: '',
    status: 'draft', featured_image: '', images: [],
    video_url: '', youtube_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingItem, setEditingItem] = useState(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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

  // Upload file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) return data.url;
      throw new Error(data.error);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Upload failed' });
      return null;
    }
  };

  // Handle featured image upload
  const handleFeaturedUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setForm({ ...form, featured_image: url });
    setUploading(false);
  };

  // Handle gallery images upload
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      setForm({ ...form, images: [...form.images, ...urls] });
    }
    setUploading(false);
  };

  // Remove gallery image
  const removeGalleryImage = (index) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        type: activeTab,
        ...form,
        images: form.images.length > 0 ? form.images : undefined,
      };
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Content created successfully' });
        setShowForm(false);
        resetForm();
        loadItems();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        type: activeTab,
        id: editingItem.id,
        ...form,
        images: form.images.length > 0 ? form.images : undefined,
      };
      const res = await fetch('/api/cms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Updated successfully' });
        setShowForm(false);
        setEditingItem(null);
        resetForm();
        loadItems();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const resetForm = () => {
    setForm({
      title: '', content: '', excerpt: '', category: '',
      status: 'draft', featured_image: '', images: [],
      video_url: '', youtube_url: '',
    });
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      content: item.content || item.description || '',
      excerpt: item.excerpt || item.summary || '',
      category: item.category || '',
      status: item.status || 'draft',
      featured_image: item.featured_image || '',
      images: item.images || [],
      video_url: item.video_url || '',
      youtube_url: item.youtube_url || '',
    });
    setShowForm(true);
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

  const youtubeId = extractYouTubeId(form.youtube_url);

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Content Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage blog posts, careers, press releases and announcements.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingItem(null); resetForm(); }} className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
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

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
          <h3 className="font-bold text-ob-navy mb-4">{editingItem ? 'Edit' : 'New'} {TABS.find(t => t.key === activeTab)?.label?.slice(0, -1) || 'Item'}</h3>
          <form onSubmit={editingItem ? handleUpdate : handleCreate} className="space-y-4">
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />

            <textarea rows={5} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write your content here... (supports line breaks)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none" />

            <input type="text" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} placeholder="Excerpt / Summary (optional)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />

            {/* Featured Image — Upload from device OR URL */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Featured Image</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {uploading ? 'Uploading...' : 'Upload from device'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFeaturedUpload} className="hidden" />
                <input type="url" value={form.featured_image} onChange={e => setForm({...form, featured_image: e.target.value})} placeholder="Or paste image URL" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
              </div>
              {form.featured_image && (
                <div className="mt-2 relative inline-block">
                  <img src={form.featured_image} alt="Featured" className="h-24 rounded-lg object-cover border border-gray-200" onError={e => e.target.style.display='none'} />
                  <button type="button" onClick={() => setForm({...form, featured_image: ''})} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                </div>
              )}
            </div>

            {/* Gallery Images — Upload multiple */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gallery Images (optional — multiple)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Add images from device
                </button>
                <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
              </div>
              {form.images.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      <button type="button" onClick={() => removeGalleryImage(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-ob-purple text-white px-1 rounded">Main</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video & YouTube */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Video URL (optional — .mp4, .webm)</label>
                <input type="url" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} placeholder="https://example.com/video.mp4" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                {form.video_url && (
                  <video src={form.video_url} controls className="mt-2 w-full h-32 rounded-lg object-cover bg-gray-900" />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">YouTube Link (optional)</label>
                <input type="url" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                {youtubeId && (
                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}`} className="w-full h-full" allowFullScreen title="YouTube preview" />
                  </div>
                )}
              </div>
            </div>

            {(activeTab === 'blog' || activeTab === 'press') && (
              <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category (optional)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
            )}

            <div className="flex gap-4 items-center">
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <button type="submit" disabled={saving || uploading} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update' : 'Create')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); resetForm(); }} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-ob-navy">{TABS.find(t => t.key === activeTab)?.label} ({items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Media</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">No {activeTab} posts yet. Click &quot;Create New&quot; to add one.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.featured_image ? <img src={item.featured_image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">📝</div>}
                      <div>
                        <span className="text-sm font-medium text-ob-navy block">{item.title}</span>
                        {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {item.featured_image && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🖼 Featured</span>}
                      {item.images && item.images.length > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">🖼 {item.images.length} gallery</span>}
                      {item.youtube_url && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">▶ YouTube</span>}
                      {item.video_url && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🎬 Video</span>}
                      {!item.featured_image && !item.youtube_url && !item.video_url && !(item.images?.length > 0) && <span className="text-xs text-gray-400">None</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(item)} className="text-ob-purple text-xs font-medium hover:underline">Edit</button>
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
