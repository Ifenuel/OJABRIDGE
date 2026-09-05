'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

const AVAILABLE_PERMISSIONS = [
  { key: 'users', label: 'User Management', desc: 'View, suspend, ban users', icon: '👥' },
  { key: 'vendors', label: 'Vendor Management', desc: 'Approve/suspend vendors, KYC review', icon: '🏪' },
  { key: 'products', label: 'Product Moderation', desc: 'Approve/reject product listings', icon: '📦' },
  { key: 'orders', label: 'Order Management', desc: 'View and manage all orders', icon: '📋' },
  { key: 'payments', label: 'Payment & Finance', desc: 'View transactions, commissions, settlements', icon: '💰' },
  { key: 'disputes', label: 'Dispute Resolution', desc: 'Review and resolve disputes', icon: '⚖️' },
  { key: 'content', label: 'Content Management', desc: 'Blog, careers, press, announcements', icon: '📝' },
  { key: 'security', label: 'Security Center', desc: 'View security events, system health', icon: '🛡️' },
  { key: 'audit', label: 'Audit Logs', desc: 'View platform activity logs', icon: '📊' },
  { key: 'settings', label: 'Platform Settings', desc: 'Manage admin roles, platform config', icon: '⚙️' },
];

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '', password: '', permissions: [] });
  const [platformSettings, setPlatformSettings] = useState({ platform_commission: 10, free_shipping_threshold: 50000 });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => { loadData(); loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setPlatformSettings(data.settings);
        setSettingsLoaded(true);
      }
    } catch {}
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: platformSettings }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Platform settings saved. Changes take effect immediately.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error saving settings' });
    }
    setSettingsSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.allSettled([
        fetch('/api/users?limit=100').then(r => r.json()),
        fetch('/api/admin/roles').then(r => r.json()),
      ]);
      if (usersRes.status === 'fulfilled') setAllUsers(usersRes.value.users || []);
      if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value.roles || []);
    } catch (err) {}
    setLoading(false);
  };

  const getPermissionsForAdmin = (adminId) => {
    const role = roles.find(r => r.admin_id === adminId);
    if (!role) return [];
    // permissions is TEXT[] from the DB — may come as array or JSON string
    const perms = role.permissions;
    if (Array.isArray(perms)) return perms;
    try { return JSON.parse(perms || '[]'); } catch { return []; }
  };

  const savePermissions = async (adminId, perms) => {
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminId, permissions: perms }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Permissions saved to database' });
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const togglePermission = (adminId, permKey) => {
    const current = getPermissionsForAdmin(adminId);
    const updated = current.includes(permKey)
      ? current.filter(p => p !== permKey)
      : [...current, permKey];
    savePermissions(adminId, updated);
  };

  const grantAll = (adminId) => savePermissions(adminId, AVAILABLE_PERMISSIONS.map(p => p.key));
  const revokeAll = (adminId) => savePermissions(adminId, []);

  const admins = allUsers.filter(u => u.role === 'admin');

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Platform Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage admin roles, permissions and platform configuration.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Super Admin Notice */}
      <div className="bg-gradient-to-r from-ob-purple/5 to-ob-purple/10 border border-ob-purple/20 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🔐</span>
          <div>
            <h3 className="font-bold text-ob-navy text-lg mb-1">Super Admin Access Control</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              You have full access to all platform features. Create sub-admin accounts below and configure exactly which sections each admin can access. Permissions are stored in the database and enforced across all sessions.
            </p>
            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-ob-purple">{admins.length}</p>
                <p className="text-xs text-gray-500">Total Admins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{roles.filter(r => r.is_super_admin).length}</p>
                <p className="text-xs text-gray-500">Super Admins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{roles.filter(r => !r.is_super_admin).length}</p>
                <p className="text-xs text-gray-500">Sub-Admins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Accounts */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">Admin Accounts</h3>
          <button onClick={() => setShowCreateAdmin(!showCreateAdmin)} className="text-sm bg-ob-purple text-white px-4 py-2 rounded-lg hover:bg-ob-purple-dark transition-colors">
            {showCreateAdmin ? 'Cancel' : '+ New Sub-Admin'}
          </button>
        </div>

        {/* Create Sub-Admin Form */}
        {showCreateAdmin && (
          <div className="px-6 py-6 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-bold text-ob-navy mb-4">Create New Sub-Admin Account</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input type="text" value={newAdminForm.name} onChange={e => setNewAdminForm({...newAdminForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={newAdminForm.email} onChange={e => setNewAdminForm({...newAdminForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="john@ojabridge.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
                <input type="tel" value={newAdminForm.phone} onChange={e => setNewAdminForm({...newAdminForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="+234..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                <input type="password" value={newAdminForm.password} onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Min 8 characters" minLength={8} />
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Assign Permissions</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <button key={perm.key} type="button" onClick={() => {
                    const has = newAdminForm.permissions.includes(perm.key);
                    setNewAdminForm({...newAdminForm, permissions: has ? newAdminForm.permissions.filter(p => p !== perm.key) : [...newAdminForm.permissions, perm.key]});
                  }} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${newAdminForm.permissions.includes(perm.key) ? 'bg-ob-purple text-white border-ob-purple' : 'bg-white text-gray-600 border-gray-200 hover:border-ob-purple'}`}>{perm.icon} {perm.label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={async () => {
                if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) { setMessage({type:'error', text:'Name, email and password are required'}); return; }
                setCreating(true);
                try {
                  const res = await fetch('/api/admin/create-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newAdminForm),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setMessage({ type: 'success', text: data.message || 'Sub-admin created successfully' });
                    setShowCreateAdmin(false);
                    setNewAdminForm({ name: '', email: '', phone: '', password: '', permissions: [] });
                    loadData();
                  } else {
                    setMessage({ type: 'error', text: data.errors?.join(', ') || data.error || 'Failed to create' });
                  }
                } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
                setCreating(false);
                setTimeout(() => setMessage({type:'',text:''}), 5000);
              }} disabled={creating} className="bg-ob-purple text-white px-5 py-2 text-sm rounded-lg font-medium hover:bg-ob-purple-dark disabled:opacity-50 transition-colors">
                {creating ? 'Creating...' : 'Create Sub-Admin Account'}
              </button>
              <button type="button" onClick={() => setShowCreateAdmin(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Admin</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Role Type</th>
                <th className="px-6 py-4 font-medium">Permissions</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : admins.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No admin accounts found.</td></tr>
              ) : admins.map(admin => {
                const perms = getPermissionsForAdmin(admin.id);
                const role = roles.find(r => r.admin_id === admin.id);
                const isSuperAdmin = role?.is_super_admin || admin.id === user?.id;
                return (
                  <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-ob-purple/10 rounded-full flex items-center justify-center text-ob-purple text-xs font-bold">{admin.name?.charAt(0) || '?'}</div>
                        <div>
                          <p className="text-sm font-medium text-ob-navy">{admin.name} {admin.id === user?.id && <span className="text-xs text-ob-purple">(You)</span>}</p>
                          <p className="text-xs text-gray-400">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{admin.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isSuperAdmin ? 'bg-ob-purple/10 text-ob-purple' : 'bg-amber-100 text-amber-700'}`}>
                        {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500">{perms.length}/{AVAILABLE_PERMISSIONS.length}</span>
                      <div className="flex gap-0.5 mt-1">
                        {AVAILABLE_PERMISSIONS.slice(0, 5).map(p => (
                          <div key={p.key} className={`w-2 h-2 rounded-full ${perms.includes(p.key) ? 'bg-green-400' : 'bg-gray-200'}`} title={p.label} />
                        ))}
                        {perms.length > 5 && <span className="text-[10px] text-gray-400 ml-1">+{perms.length - 5}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {admin.id !== user?.id && (
                        <div className="flex space-x-2">
                          <button onClick={() => { setSelectedAdmin(admin); setShowRoleModal(true); }} className="text-ob-purple text-xs font-medium hover:underline">Configure Access</button>
                          {!isSuperAdmin && (
                            <button onClick={async () => {
                              if (!confirm(`Remove admin role from ${admin.name}?`)) return;
                              try {
                                const res = await fetch(`/api/admin/roles?userId=${admin.id}`, { method: 'DELETE' });
                                const data = await res.json();
                                if (data.success) { setMessage({type:'success', text:'Admin role removed'}); loadData(); }
                                else setMessage({type:'error', text: data.error});
                              } catch(e) { setMessage({type:'error', text:'Failed'}); }
                              setTimeout(() => setMessage({type:'',text:''}), 3000);
                            }} className="text-red-500 text-xs font-medium hover:underline">Remove</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Configuration */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Commission Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Platform Commission (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={platformSettings.platform_commission}
                  onChange={e => setPlatformSettings({ ...platformSettings, platform_commission: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-ob-navy focus:border-ob-purple outline-none"
                />
                <span className="text-sm text-gray-500">% per transaction</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Deducted from each successful payment before vendor settlement.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Free Shipping Threshold (₦)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">₦</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={platformSettings.free_shipping_threshold}
                  onChange={e => setPlatformSettings({ ...platformSettings, free_shipping_threshold: parseInt(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-ob-navy focus:border-ob-purple outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping.</p>
            </div>
            <button
              onClick={saveSettings}
              disabled={settingsSaving}
              className="bg-ob-purple text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-ob-purple-dark disabled:opacity-50 transition-colors"
            >
              {settingsSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Platform Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Platform</span>
              <span className="text-sm font-medium text-ob-navy">OjaBridge</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Payment Gateway</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Paystack</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Supported Currencies</span>
              <span className="text-xs text-gray-500">NGN</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Escrow System</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Config Modal */}
      {showRoleModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-ob-navy">Configure Access</h3>
                <p className="text-sm text-gray-500">Grant or revoke dashboard permissions for {selectedAdmin.name}</p>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => grantAll(selectedAdmin.id)} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">Grant All</button>
              <button onClick={() => revokeAll(selectedAdmin.id)} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Revoke All</button>
            </div>

            <div className="space-y-2">
              {AVAILABLE_PERMISSIONS.map(perm => {
                const hasPerm = getPermissionsForAdmin(selectedAdmin.id).includes(perm.key);
                return (
                  <div key={perm.key} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${hasPerm ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{perm.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-ob-navy">{perm.label}</p>
                        <p className="text-xs text-gray-400">{perm.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePermission(selectedAdmin.id, perm.key)}
                      className={`w-12 h-6 rounded-full transition-all ${hasPerm ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${hasPerm ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-400">Changes are saved to the database immediately</p>
              <button onClick={() => setShowRoleModal(false)} className="bg-ob-purple text-white px-6 py-2 text-sm rounded-lg hover:bg-ob-purple-dark transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
