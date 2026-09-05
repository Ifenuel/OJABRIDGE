'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { StatCard, DashboardBarChart, DashboardPieChart, DashboardLineChart } from '@/components/Charts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [usersRes, vendorsRes, ordersRes, productsRes, disputesRes] = await Promise.allSettled([
          fetch('/api/users?limit=200').then(r => r.json()),
          fetch('/api/vendors?limit=200').then(r => r.json()),
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/products?admin=true&limit=200').then(r => r.json()),
          fetch('/api/disputes?limit=100').then(r => r.json()),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.success) setUsers(usersRes.value.users || []);
        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.success) setVendors(vendorsRes.value.vendors || []);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (productsRes.status === 'fulfilled' && productsRes.value.success) setProducts(productsRes.value.products || []);
        if (disputesRes.status === 'fulfilled' && disputesRes.value.success) setDisputes(disputesRes.value.disputes || []);
      } catch (err) { console.error('Dashboard load error:', err); }
      setLoading(false);
    }
    loadAll();
  }, []);

  // === DATE FILTER ===
  const filterByPeriod = (items, p) => {
    if (p === 'all') return items;
    const now = new Date();
    const days = p === '7d' ? 7 : p === '30d' ? 30 : p === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return items.filter(item => {
      if (!item.created_at) return true;
      return new Date(item.created_at) >= cutoff;
    });
  };

  const filteredOrders = filterByPeriod(orders, period);
  const filteredUsers = filterByPeriod(users, period);

  // Computed stats from FILTERED data
  const totalRevenue = filteredOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const pendingKyc = vendors.filter(v => ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(v.kyc_status)).length;
  const pendingProducts = products.filter(p => p.moderation_status === 'pending').length;
  const openDisputes = disputes.filter(d => ['open', 'under_review', 'vendor_response_required', 'escalated'].includes(d.status)).length;
  const paymentIssues = filteredOrders.filter(o => o.payment_status === 'failed' || o.payment_status === 'refunded').length;
  const activeOrders = filteredOrders.filter(o => ['confirmed', 'processing', 'shipped', 'in_transit'].includes(o.status)).length;
  const completedOrders = filteredOrders.filter(o => ['delivered', 'completed'].includes(o.status)).length;

  const stats = {
    totalUsers: filteredUsers.length,
    totalVendors: vendors.length,
    totalCustomers: filteredUsers.filter(u => u.role === 'customer').length,
    totalRetailers: filteredUsers.filter(u => u.role === 'retailer').length,
    totalOrders: filteredOrders.length,
    totalRevenue,
    commission,
    netToVendors: totalRevenue - commission,
    pendingKyc,
    pendingProducts,
    openDisputes,
    paymentIssues,
    activeOrders,
    completedOrders,
  };

  // Chart data from FILTERED orders
  const now = new Date();
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), i, 1).toLocaleString('en', { month: 'short' });
    const monthOrders = filteredOrders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear() && o.payment_status === 'paid';
    });
    return { name: month, value: monthOrders.reduce((s, o) => s + Number(o.total || 0), 0) };
  });

  const orderStatusData = [
    { name: 'Completed', value: completedOrders },
    { name: 'Active', value: activeOrders },
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ];

  const userDistData = [
    { name: 'Customers', value: users.filter(u => u.role === 'customer').length },
    { name: 'Vendors', value: users.filter(u => u.role === 'vendor').length },
    { name: 'Retailers', value: users.filter(u => u.role === 'retailer').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ];

  const recentUsers = filteredUsers.slice(0, 5);
  const recentOrders = filteredOrders.slice(0, 5);

  return (
    <DashboardLayout role="admin">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Platform Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name || 'Admin'}. Here&apos;s what&apos;s happening on OjaBridge.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{p === 'all' ? 'All Time' : p}</button>
          ))}
        </div>
      </div>

      {/* Stats Row 1 — Revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} color="text-green-600" change={totalRevenue === 0 ? 'No paid orders yet' : `From ${stats.completedOrders} completed orders`} />
        <StatCard label="Platform Commission" value={`₦${commission.toLocaleString()}`} color="text-amber-600" change={commission === 0 ? '10% per transaction' : '10% per transaction'} />
        <StatCard label="Net to Vendors" value={`₦${stats.netToVendors.toLocaleString()}`} color="text-blue-600" change={stats.netToVendors === 0 ? 'Paid after commission' : 'Paid after commission deduction'} />
        <StatCard label="Total Orders" value={stats.totalOrders} color="text-ob-purple" change={stats.totalOrders === 0 ? 'No orders placed yet' : `${stats.activeOrders} active, ${stats.completedOrders} completed`} />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={stats.totalUsers} color="text-ob-navy" change={`${stats.totalCustomers} customers, ${stats.totalVendors} vendors`} />
        <StatCard label="Total Vendors" value={stats.totalVendors} color="text-blue-600" change={stats.totalVendors === 0 ? 'No vendors registered yet' : `${pendingKyc} pending KYC`} />
        <StatCard label="Total Retailers" value={stats.totalRetailers} color="text-green-600" change={stats.totalRetailers === 0 ? 'No retailers registered yet' : 'Active retailers'} />
        <StatCard label="Active Orders" value={stats.activeOrders} color="text-indigo-600" change={stats.activeOrders === 0 ? 'No active orders' : 'Currently being processed'} />
        <StatCard label="Completed Orders" value={stats.completedOrders} color="text-green-600" change={stats.completedOrders === 0 ? 'No completed orders yet' : 'Successfully delivered'} />
      </div>

      {/* Stats Row 3 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending KYC" value={pendingKyc} color={pendingKyc > 0 ? 'text-amber-600' : 'text-green-600'} change={pendingKyc === 0 ? 'All vendors verified' : 'Awaiting verification'} />
        <StatCard label="Pending Products" value={pendingProducts} color={pendingProducts > 0 ? 'text-amber-600' : 'text-green-600'} change={pendingProducts === 0 ? 'No products pending review' : 'Awaiting moderation'} />
        <StatCard label="Open Disputes" value={openDisputes} color={openDisputes > 0 ? 'text-red-600' : 'text-green-600'} change={openDisputes === 0 ? 'No open disputes' : 'Need attention'} />
        <StatCard label="Payment Issues" value={paymentIssues} color={paymentIssues > 0 ? 'text-red-600' : 'text-green-600'} change={paymentIssues === 0 ? 'No payment issues' : 'Failed or refunded'} />
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
          <h3 className="font-bold text-ob-navy mb-4">Monthly Orders</h3>
          <DashboardLineChart data={revenueByMonth.map((d, i) => ({ name: d.name, value: orders.filter(o => { const od = new Date(o.created_at); return od.getMonth() === i && od.getFullYear() === now.getFullYear(); }).length }))} />
        </div>
      </div>

      {/* Requires Attention */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <h3 className="font-bold text-ob-navy mb-4">Requires Attention</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending KYC', value: pendingKyc, href: '/admin-dashboard/vendors', color: 'text-amber-600' },
            { label: 'Pending Products', value: pendingProducts, href: '/admin-dashboard/products', color: 'text-blue-600' },
            { label: 'Open Disputes', value: openDisputes, href: '/admin-dashboard/disputes', color: 'text-red-600' },
            { label: 'Payment Issues', value: paymentIssues, href: '/admin-dashboard/payments', color: 'text-red-600' },
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
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${o.status === 'completed' || o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-amber-100 text-amber-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
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
