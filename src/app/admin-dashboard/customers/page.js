'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ActionMenu from '@/components/ActionMenu';
import DataTable from '@/components/DataTable';
import DashboardLayout from '@/components/DashboardLayout';
import { exportData, filterByDateRange, formatDate } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

/**
 * Admin → Customers
 * A focused view of ONLY customer accounts (not vendors/retailers/admins):
 * name, email, gender, status, when they joined and last login.
 * Read-only tracking — sensitive details stay out of this page on purpose.
 */
export default function AdminCustomersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users?role=customer&limit=500');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error('Failed to load customers:', err); }
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
        setMessage({ type: 'success', text: `Customer ${status} successfully` });
        loadCustomers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update customer' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filtered = users.filter(u => {
    if (genderFilter !== 'all' && (u.gender || 'unspecified') !== genderFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const genderColors = { male: 'bg-blue-100 text-blue-700', female: 'bg-pink-100 text-pink-700', unspecified: 'bg-gray-100 text-gray-600' };
  const statusColors = { active: 'bg-green-100 text-green-700', suspended: 'bg-red-100 text-red-700', banned: 'bg-red-200 text-red-800', pending_verification: 'bg-amber-100 text-amber-700' };

  return (
    <DashboardLayout role="admin" requiredPermission="users">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">Track everyone shopping on OjaBridge — names, emails, gender and activity. Full personal details stay on the Users page.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Customers', value: users.length, color: 'text-ob-navy' },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'text-green-600' },
          { label: 'Male', value: users.filter(u => u.gender === 'male').length, color: 'text-blue-600' },
          { label: 'Female', value: users.filter(u => u.gender === 'female').length, color: 'text-pink-600' },
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
        <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unspecified">Not specified</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="pending_verification">Pending Verification</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">All Customers ({filtered.length})</h3>
          <ExportButton
            dateRangeOptions={dateRangeOptions}
            onExport={({ format, dateRange }) => {
              const exportRows = dateRange ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'created_at') : filtered;
              exportData({
                format,
                title: 'Customers Report',
                filename: 'ojabridge_customers',
                dateRange,
                summary: [
                  { label: 'Total Customers', value: users.length },
                  { label: 'Exported', value: exportRows.length },
                ],
                columns: [
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'gender', label: 'Gender', format: v => v || 'Not specified' },
                  { key: 'status', label: 'Status' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'created_at', label: 'Joined', format: v => (v ? new Date(v).toLocaleString() : '—') },
                  { key: 'last_login_at', label: 'Last Login', format: v => (v ? formatDate(v) : 'Never') },
                ],
                rows: exportRows.map(u => ({
                  name: u.name,
                  email: u.email,
                  gender: u.gender,
                  status: u.status,
                  phone: u.phone || '—',
                  created_at: u.created_at,
                  last_login_at: u.last_login_at,
                })),
              });
            }}
          />
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Customer', render: u => (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-ob-purple rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0) || '?'}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ob-navy truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
              </div>
            ) },
            { key: 'gender', label: 'Gender', render: u => {
              const g = u.gender || 'unspecified';
              return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${genderColors[g]}`}>{g === 'unspecified' ? 'Not specified' : g}</span>;
            } },
            { key: 'status', label: 'Status', render: u => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[u.status] || 'bg-gray-100 text-gray-600'}`}>{u.status}</span> },
            { key: 'created_at', label: 'Joined', render: u => u.created_at ? new Date(u.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
            { key: 'last_login_at', label: 'Last Login', render: u => u.last_login_at ? new Date(u.last_login_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
          ]}
          rows={loading ? [] : filtered}
          emptyMessage={loading ? 'Loading customers…' : 'No customers found yet.'}
          actions={u => (
            <ActionMenu actions={[
              { label: 'View Orders', icon: '📦', onClick: () => window.location.assign(`/admin-dashboard/orders?customerId=${u.id}&customerName=${encodeURIComponent(u.name || u.email)}`) },
              { label: 'Suspend', icon: '⚠️', hidden: u.status !== 'active', className: 'text-amber-600', confirm: `Suspend ${u.name}? They will not be able to log in.`, onClick: () => updateUserStatus(u.id, 'suspended') },
              { label: 'Ban', icon: '🚫', hidden: u.status !== 'active', className: 'text-red-600', confirm: `Ban ${u.name}? They will lose access permanently.`, onClick: () => updateUserStatus(u.id, 'banned') },
              { label: 'Reactivate', icon: '♻️', hidden: !['suspended', 'banned'].includes(u.status), className: 'text-green-600', onClick: () => updateUserStatus(u.id, 'active') },
            ]} />
          )}
        />
      </div>
    </DashboardLayout>
  );
}
