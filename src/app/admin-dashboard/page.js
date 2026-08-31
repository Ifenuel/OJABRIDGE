'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { StatCard, DashboardBarChart, DashboardPieChart, DashboardLineChart, ExportButton } from '@/components/Charts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [usersRes, vendorsRes, ordersRes, productsRes] = await Promise.allSettled([
          fetch('/api/users?limit=200').then(r => r.json()),
          fetch('/api/vendors?limit=200').then(r => r.json()),
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/products?limit=200').then(r => r.json()),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.success) setUsers(usersRes.value.users || []);
        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.success) setVendors(vendorsRes.value.vendors || []);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (productsRes.status === 'fulfilled' && productsRes.value.success) setProducts(productsRes.value.products || []);
      } catch (err) { console.error('Dashboard load error:', err); }
      setLoading(false);
    }
    loadAll();
  }, []);

  // Computed stats
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const pendingKyc = vendors.filter(v => ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(v.kyc_status)).length;
  const pendingProducts = products.filter(p => p.moderation_status === 'pending').length;

  const stats = {
    totalUsers: users.length,
    totalVendors: vendors.length,
    totalCustomers: users.filter(u => u.role === 'customer').length,
    totalOrders: orders.length,
    totalRevenue,
    commission,
    netToVendors: totalRevenue - commission,
    pendingKyc,
    pendingProducts,
    openDisputes: 0,
  };

  // Chart data from real orders
  const now = new Date();
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), i, 1).toLocaleString('en', { month: 'short' });
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear() && o.payment_status === 'paid';
    });
    return { name: month, value: monthOrders.reduce((s, o) => s + Number(o.total || 0), 0) };
  });

  const orderStatusData = [
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length },
    { name: 'Processing', value: orders.filter(o => o.status === 'processing').length },
    { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ];

  const userDistData = [
    { name: 'Customers', value: users.filter(u => u.role === 'customer').length },
    { name: 'Vendors', value: users.filter(u => u.role === 'vendor').length },
    { name: 'Retailers', value: users.filter(u => u.role === 'retailer').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ];

  const recentUsers = users.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <DashboardLayout role="admin">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Platform Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name || 'Admin'}. Here&apos;s what&apos;s happening on OjaBridge.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} color="text-green-600" />
        <StatCard title="Total Orders" value={stats.totalOrders} color="text-ob-purple" />
        <StatCard title="Total Vendors" value={stats.totalVendors} color="text-blue-600" />
        <StatCard title="Total Users" value={stats.totalUsers} color="text-ob-navy" />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Platform Commission" value={`₦${commission.toLocaleString()}`} color="text-amber-600" />
        <StatCard title="Net to Vendors" value={`₦${(totalRevenue - commission).toLocaleString()}`} color="text-green-600" />
        <StatCard title="Pending KYC" value={pendingKyc} color="pendingKyc > 0 ? 'text-amber-600' : 'text-green-600'" />
        <StatCard title="Pending Products" value={pendingProducts} color="pendingProducts > 0 ? 'text-amber-600' : 'text-green-600'" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Revenue Overview</h3>
          <DashboardBarChart data={revenueByMonth} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Order Status</h3>
          <DashboardPieChart data={orderStatusData} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">User Distribution</h3>
          <DashboardPieChart data={userDistData} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Platform Growth</h3>
          <DashboardLineChart data={revenueByMonth.map((d, i) => ({ name: d.name, value: i * 2 + Math.floor(Math.random() * 3) }))} />
        </div>
      </div>

      {/* Requires Attention */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <h3 className="font-bold text-ob-navy mb-4">Requires Attention</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending KYC', value: pendingKyc, href: '/admin-dashboard/vendors', color: 'text-amber-600' },
            { label: 'Pending Products', value: pendingProducts, href: '/admin-dashboard/products', color: 'text-blue-600' },
            { label: 'Open Disputes', value: 0, href: '/admin-dashboard/disputes', color: 'text-red-600' },
            { label: 'Payment Issues', value: 0, href: '/admin-dashboard/payments', color: 'text-red-600' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="p-4 rounded-lg border border-gray-100 hover:border-ob-purple/30 transition-colors">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ob-navy">Recent Users</h3>
            <Link href="/admin-dashboard/users" className="text-ob-purple text-xs font-medium hover:underline">View All →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-ob-purple rounded-full flex items-center justify-center text-white text-xs font-bold">{(u.name || '?')[0]}</div>
                    <div>
                      <p className="text-sm font-medium text-ob-navy">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : u.role === 'vendor' ? 'bg-ob-purple/10 text-ob-purple' : u.role === 'retailer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ob-navy">Recent Orders</h3>
            <Link href="/admin-dashboard/orders" className="text-ob-purple text-xs font-medium hover:underline">View All →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-ob-navy">{o.order_number}</p>
                    <p className="text-xs text-gray-400">{o.currency} {Number(o.total).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-amber-100 text-amber-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-bold text-ob-navy mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', href: '/admin-dashboard/users', icon: '👥' },
            { label: 'Review Vendors', href: '/admin-dashboard/vendors', icon: '🏪' },
            { label: 'Moderate Products', href: '/admin-dashboard/products', icon: '📦' },
            { label: 'View Orders', href: '/admin-dashboard/orders', icon: '📋' },
            { label: 'Payments', href: '/admin-dashboard/payments', icon: '💳' },
            { label: 'Settlements', href: '/admin-dashboard/settlements', icon: '💰' },
            { label: 'Security', href: '/admin-dashboard/security', icon: '🔒' },
            { label: 'Audit Logs', href: '/admin-dashboard/audit', icon: '📝' },
          ].map((action, i) => (
            <Link key={i} href={action.href} className="p-4 rounded-lg border border-gray-100 hover:border-ob-purple/30 hover:bg-ob-purple/5 transition-all text-center">
              <span className="text-2xl">{action.icon}</span>
              <p className="text-xs font-medium text-ob-navy mt-2">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
