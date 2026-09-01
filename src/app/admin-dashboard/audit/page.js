'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminAuditPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, usersRes] = await Promise.allSettled([
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/users?limit=100').then(r => r.json()),
        ]);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (usersRes.status === 'fulfilled' && usersRes.value.success) setUsers(usersRes.value.users || []);
      } catch (err) {}
      setLoading(false);
    }
    loadData();
  }, []);

  // Build audit-like activity from orders + users
  const activities = [];

  orders.forEach(o => {
    activities.push({
      id: o.id + '-created',
      timestamp: o.created_at,
      action: 'order.created',
      entity: 'order',
      entityId: o.order_number,
      details: `New order ${o.order_number} — ₦${Number(o.total || 0).toLocaleString()}`,
      severity: 'info',
    });
    if (o.payment_status === 'paid') {
      activities.push({
        id: o.id + '-payment',
        timestamp: o.created_at,
        action: 'payment.success',
        entity: 'order',
        entityId: o.order_number,
        details: `Payment confirmed for ${o.order_number}`,
        severity: 'info',
      });
    }
    if (o.status === 'cancelled') {
      activities.push({
        id: o.id + '-cancel',
        timestamp: o.updated_at || o.created_at,
        action: 'order.cancelled',
        entity: 'order',
        entityId: o.order_number,
        details: `Order ${o.order_number} was cancelled`,
        severity: 'warning',
      });
    }
  });

  users.forEach(u => {
    activities.push({
      id: u.id + '-register',
      timestamp: u.created_at,
      action: 'user.registered',
      entity: 'user',
      entityId: u.email,
      details: `New ${u.role} account: ${u.name} (${u.email})`,
      severity: 'info',
    });
  });

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const filtered = activities.filter(a => {
    if (actionFilter !== 'all' && !a.action.includes(actionFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (a.details || '').toLowerCase().includes(q) || (a.action || '').toLowerCase().includes(q) || (a.entityId || '').toLowerCase().includes(q);
    }
    return true;
  });

  const severityColor = (s) => ({ info: 'bg-blue-100 text-blue-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600');

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Entity', 'Entity ID', 'Details', 'Severity'];
    const rows = filtered.map(a => [
      new Date(a.timestamp).toISOString(),
      a.action,
      a.entity,
      a.entityId,
      `"${(a.details || '').replace(/"/g, '""')}"`,
      a.severity,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Complete activity log of all platform actions for compliance and investigation.</p>
        </div>
        <button onClick={exportCSV} className="text-sm bg-white border border-gray-200 text-ob-navy px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV ({filtered.length})
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Actions</option>
          <option value="order">Orders</option>
          <option value="payment">Payments</option>
          <option value="user">Users</option>
          <option value="security">Security</option>
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="px-6 py-4 font-medium">Timestamp</th><th className="px-6 py-4 font-medium">Action</th><th className="px-6 py-4 font-medium">Entity</th><th className="px-6 py-4 font-medium">Details</th><th className="px-6 py-4 font-medium">Severity</th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">No audit activity found.</td></tr>
              ) : filtered.slice(0, 100).map((a, i) => (
                <tr key={a.id + i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-ob-navy">{a.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.entity}: {a.entityId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{a.details}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-1 rounded-full ${severityColor(a.severity)}`}>{a.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
