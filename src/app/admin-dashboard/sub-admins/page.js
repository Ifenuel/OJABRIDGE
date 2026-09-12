'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/sub-admins', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSubAdmins(data.subAdmins || []);
        setPermissions(data.permissions || []);
      }
    } catch (e) {
      console.error('Failed to load sub-admins:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const togglePermission = (key) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  const createSubAdmin = async () => {
    if (!form.name || !form.email || !form.password || form.permissions.length === 0) {
      setMessage('Please fill all fields and assign at least one permission');
      return;
    }
    if (form.password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Sub-admin created successfully!');
        setShowCreate(false);
        setForm({ name: '', email: '', password: '', permissions: [] });
        loadData();
      } else {
        setMessage(data.error || 'Failed to create sub-admin');
      }
    } catch (e) {
      setMessage('Failed to create sub-admin');
    }
    setSaving(false);
  };

  const updatePermissions = async () => {
    if (!editTarget || form.permissions.length === 0) {
      setMessage('Assign at least one permission');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/sub-admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subAdminId: editTarget.id, permissions: form.permissions }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Permissions updated!');
        setEditTarget(null);
        loadData();
      } else {
        setMessage(data.error || 'Failed to update');
      }
    } catch (e) {
      setMessage('Failed to update');
    }
    setSaving(false);
  };

  const toggleStatus = async (sa) => {
    const newStatus = sa.status === 'active' ? 'suspended' : 'active';
    try {
      await fetch('/api/admin/sub-admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subAdminId: sa.id, status: newStatus }),
      });
      loadData();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const deleteSubAdmin = async (sa) => {
    if (!confirm(`Remove ${sa.name} as sub-admin? Their account will be suspended.`)) return;
    try {
      await fetch(`/api/admin/sub-admins?id=${sa.id}`, { method: 'DELETE', credentials: 'include' });
      loadData();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const getPermLabel = (key) => permissions.find(p => p.key === key)?.label || key;

  return (
    <DashboardLayout role="admin" requiredPermission="sub-admins">
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage support agents with specific permissions</p>
        </div>
        <button onClick={() => { setShowCreate(true); setEditTarget(null); setForm({ name: '', email: '', password: '', permissions: [] }); }}
          className="bg-ob-purple text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ob-purple-dark transition-colors">
          + Add Sub-Admin
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') || message.includes('Updated') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Create / Edit Form */}
      {(showCreate || editTarget) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editTarget ? `Edit Permissions — ${editTarget.name}` : 'Create New Sub-Admin'}</h3>

          {!editTarget && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-ob-purple outline-none" placeholder="e.g. Tunde Support" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-ob-purple outline-none" placeholder="support@ojabridge.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:border-ob-purple outline-none" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Assigned Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {permissions.map(perm => (
                <label key={perm.key}
                  className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.permissions.includes(perm.key)
                      ? 'bg-ob-purple/5 border-ob-purple text-ob-purple'
                      : 'bg-white border-gray-100 hover:border-gray-300'
                  }`}>
                  <input type="checkbox" checked={form.permissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="mt-0.5 rounded border-gray-300 text-ob-purple focus:ring-ob-purple" />
                  <div>
                    <p className="text-sm font-medium">{perm.label}</p>
                    <p className="text-[11px] text-gray-500">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={editTarget ? updatePermissions : createSubAdmin} disabled={saving}
              className="bg-ob-purple text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ob-purple-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editTarget ? 'Update Permissions' : 'Create Sub-Admin'}
            </button>
            <button onClick={() => { setShowCreate(false); setEditTarget(null); setMessage(''); }}
              className="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* Sub-Admin List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : subAdmins.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No sub-admins yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Sub-Admin" to create your first support agent</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subAdmins.map(sa => (
            <div key={sa.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-ob-purple/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-ob-purple font-semibold text-sm">{sa.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{sa.name}</p>
                  <p className="text-xs text-gray-500 truncate">{sa.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(sa.permissions || []).map(p => (
                      <span key={p} className="text-[10px] bg-ob-purple/10 text-ob-purple px-1.5 py-0.5 rounded-full">{getPermLabel(p)}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${sa.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sa.status}
                </span>
                <button onClick={() => { setEditTarget(sa); setForm({ ...form, permissions: sa.permissions || [] }); setShowCreate(false); setMessage(''); }}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100">
                  Edit
                </button>
                <button onClick={() => toggleStatus(sa)}
                  className={`text-xs px-3 py-1 rounded-lg ${sa.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  {sa.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button onClick={() => deleteSubAdmin(sa)}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
