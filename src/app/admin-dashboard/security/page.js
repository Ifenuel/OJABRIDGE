'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminSecurityPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, usersRes, healthRes] = await Promise.allSettled([
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/users?limit=100').then(r => r.json()),
          fetch('/api/admin/system-health').then(r => r.json()),
        ]);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (usersRes.status === 'fulfilled' && usersRes.value.success) setUsers(usersRes.value.users || []);
        if (healthRes.status === 'fulfilled' && healthRes.value.success) setHealth(healthRes.value.checks || []);
      } catch (err) {}
      setLoading(false);
    }
    loadData();
  }, []);

  const failedLogins = users.reduce((sum, u) => sum + (u.failed_login_attempts || 0), 0);
  const suspendedUsers = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;
  const lockedAccounts = users.filter(u => u.locked_until && new Date(u.locked_until) > new Date()).length;

  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Security Center</h1><p className="text-gray-500 text-sm mt-1">Monitor security events, fraud detection, system health and account enforcement.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Failed Login Attempts', value: failedLogins, c: 'text-red-600', icon: '🔐' },
          { l: 'Locked Accounts', value: lockedAccounts, c: 'text-amber-600', icon: '🔒' },
          { l: 'Suspended/Banned', value: suspendedUsers, c: 'text-orange-600', icon: '🚫' },
          { l: 'Active Users', value: users.filter(u => u.status === 'active').length, c: 'text-green-600', icon: '✅' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.l}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Accounts Requiring Attention</h3>
          {loading ? <p className="text-gray-400 text-sm py-4">Loading...</p> : (
            <div className="space-y-3">
              {users.filter(u => u.status !== 'active' || (u.failed_login_attempts || 0) > 0).slice(0, 10).map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-ob-navy">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.failed_login_attempts > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{u.failed_login_attempts} failed</span>}
                    {u.status === 'suspended' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Suspended</span>}
                    {u.status === 'banned' && <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">Banned</span>}
                  </div>
                </div>
              ))}
              {users.filter(u => u.status !== 'active' || (u.failed_login_attempts || 0) > 0).length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No security concerns. All accounts are healthy.</p>
              )}
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">System Health</h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {health.length === 0 ? (
                <p className="text-gray-400 text-sm">Unable to check system health.</p>
              ) : health.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.ok ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className={`text-xs font-medium ${s.ok ? 'text-green-600' : 'text-amber-600'}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
