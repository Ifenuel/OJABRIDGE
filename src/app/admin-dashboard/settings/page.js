'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AvatarUpload from '@/components/AvatarUpload';
import { useAuth } from '@/context/AuthContext';

const AVAILABLE_PERMISSIONS = [
  { key: 'live-chats', label: 'Live Chat Support', desc: 'Respond to customer live chats', icon: '💬' },
  { key: 'orders', label: 'Order Management', desc: 'View and manage customer orders', icon: '📋' },
  { key: 'disputes', label: 'Dispute Resolution', desc: 'Review and resolve disputes', icon: '⚖️' },
  { key: 'users', label: 'User Management', desc: 'View customer and user accounts', icon: '👥' },
  { key: 'vendors', label: 'Vendor Management', desc: 'Approve/suspend vendors, KYC review', icon: '🏪' },
  { key: 'retailers', label: 'Retailer Management', desc: 'View and manage retailer accounts', icon: '🏬' },
  { key: 'products', label: 'Product Moderation', desc: 'Approve/reject product listings', icon: '📦' },
  { key: 'payments', label: 'Payment & Finance', desc: 'View transactions, commissions, settlements', icon: '💰' },
  { key: 'reports', label: 'Reports', desc: 'View reports and analytics', icon: '📊' },
  { key: 'content', label: 'Content Management', desc: 'Blog, careers, press, announcements', icon: '📝' },
  { key: 'newsletter', label: 'Newsletter', desc: 'Manage newsletter subscribers and sends', icon: '✉️' },
];

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
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
      const usersRes = await fetch('/api/admin/sub-admins', { credentials: 'include' }).then(r => r.json());
      if (usersRes.success) {
        // Sub-admin records from the canonical subsystem
        setAllUsers(
          (usersRes.subAdmins || []).map(sa => ({
            id: sa.user_id || sa.id,
            name: sa.name,
            email: sa.email,
            status: sa.status || 'active',
            created_at: sa.created_at,
            permissions: typeof sa.permissions === 'string' ? JSON.parse(sa.permissions) : (sa.permissions || []),
          }))
        );
        setRoles(usersRes.subAdmins || []);
      }
    } catch (err) {}
    setLoading(false);
  };

  const getPermissionsForAdmin = (adminId) => {
    const sa = allUsers.find(u => (u.id === adminId));
    if (!sa) return [];
    const perms = sa.permissions;
    if (Array.isArray(perms)) return perms;
    try { return JSON.parse(perms || '[]'); } catch { return []; }
  };

  const savePermissions = async (adminId, perms) => {
    try {
      // Find the sub-admin record id to PATCH via the canonical endpoint
      const sa = allUsers.find(u => (u.id === adminId));
      if (!sa || !sa.id) {
        setMessage({ type: 'error', text: 'Sub-admin record not found' });
        return;
      }
      const res = await fetch('/api/admin/sub-admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subAdminId: sa.id, permissions: perms }),
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



  const admins = allUsers.filter(u => u.email); // sub_admin records from canonical subsystem

  return (
    <DashboardLayout role="admin" requiredPermission="settings">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Platform Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage admin roles, permissions and platform configuration.</p>
      </div>

      {/* Profile Picture */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 mb-6 max-w-3xl">
        <h3 className="font-bold text-ob-navy mb-4">Profile Picture</h3>
        <AvatarUpload currentUrl={user?.avatar_url || null} name={user?.name} onSaved={() => {}} />
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
              You have full access to all platform features.              Create sub-admin accounts from the Sub-Admins page in the sidebar, and configure admin access levels below. Permissions are stored in the database and enforced across all sessions.
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
          <h3 className="font-bold text-ob-navy">Admin Accounts</h3>              <span className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
            Sub-Admins managed from the sidebar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </span>
        </div>


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
                const isSuperAdmin = admin.id === user?.id;
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
                      <a href="/admin-dashboard/sub-admins" className="text-ob-purple text-xs font-medium hover:underline">
                        Manage
                      </a>
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

      {/* Sub-admin permission management note */}
      <div className="bg-gradient-to-r from-ob-purple/5 to-ob-purple/10 border border-ob-purple/20 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🔐</span>
          <div>
            <h3 className="font-bold text-ob-navy text-lg mb-1">Sub-Admin Access Control</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Create sub-admin accounts and assign their permissions on the Sub-Admins page in the sidebar. Permissions are stored in the database and enforced across all sessions.
            </p>
            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-ob-purple">{admins.length}</p>
                <p className="text-xs text-gray-500">Sub-Admins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{admins.filter(a => a.status === 'active').length}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{admins.filter(a => a.status !== 'active').length}</p>
                <p className="text-xs text-gray-500">Suspended</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
