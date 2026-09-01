'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users?limit=100');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error('Failed to load users:', err); }
    setLoading(false);
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `User ${status} successfully` });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const roleColors = { customer: 'bg-blue-100 text-blue-700', vendor: 'bg-ob-purple/10 text-ob-purple', retailer: 'bg-green-100 text-green-700', admin: 'bg-amber-100 text-amber-700' };
  const statusColors = { active: 'bg-green-100 text-green-700', suspended: 'bg-red-100 text-red-700', banned: 'bg-red-200 text-red-800', pending_verification: 'bg-amber-100 text-amber-700' };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Users</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all platform users — customers, vendors, retailers and administrators.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length, color: 'text-ob-navy' },
          { label: 'Customers', value: users.filter(u => u.role === 'customer').length, color: 'text-blue-600' },
          { label: 'Vendors', value: users.filter(u => u.role === 'vendor').length, color: 'text-ob-purple' },
          { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
          <option value="retailer">Retailers</option>
          <option value="admin">Admins</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Last Login</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No users found.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-ob-purple rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0) || '?'}</div>
                        <div><p className="text-sm font-medium text-ob-navy">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[u.status] || 'bg-gray-100 text-gray-600'}`}>{u.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {u.status === 'active' && u.role !== 'admin' && (
                          <>
                            <button onClick={() => updateUserStatus(u.id, 'suspended')} className="text-amber-600 text-xs font-medium hover:underline">Suspend</button>
                            <button onClick={() => updateUserStatus(u.id, 'banned')} className="text-red-500 text-xs font-medium hover:underline">Ban</button>
                          </>
                        )}
                        {(u.status === 'suspended' || u.status === 'banned') && (
                          <button onClick={() => updateUserStatus(u.id, 'active')} className="text-green-600 text-xs font-medium hover:underline">Reactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
