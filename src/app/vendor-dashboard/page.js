'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { StatCard, DashboardBarChart, DashboardPieChart, DashboardLineChart } from '@/components/Charts';

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, productsRes, vendorsRes] = await Promise.allSettled([
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/products?limit=200').then(r => r.json()),
          fetch('/api/vendors?limit=10').then(r => r.json()),
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (productsRes.status === 'fulfilled' && productsRes.value.success) setProducts(productsRes.value.products || []);
        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.success) {
          const myVendor = vendorsRes.value.vendors?.find(v => v.user_id === user?.id);
          setVendor(myVendor || vendorsRes.value.vendors?.[0] || null);
        }
      } catch (err) { console.error('Vendor dashboard load error:', err); }
      setLoading(false);
    }
    if (user) loadData();
  }, [user]);

  // Date filter
  const filterByPeriod = (items, p) => {
    if (p === 'all') return items;
    const now = new Date();
    const days = p === '7d' ? 7 : p === '30d' ? 30 : p === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return items.filter(item => !item.created_at || new Date(item.created_at) >= cutoff);
  };
  const filteredOrders = filterByPeriod(orders, period);

  // Compute stats from FILTERED data
  const totalRevenue = filteredOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const processingOrders = filteredOrders.filter(o => o.status === 'processing' || o.status === 'shipped').length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;

  // Chart data from FILTERED orders
  const now = new Date();
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), i, 1).toLocaleString('en', { month: 'short' });
    const mOrders = filteredOrders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear() && o.payment_status === 'paid';
    });
    return { name: month, value: mOrders.reduce((s, o) => s + Number(o.total || 0), 0) };
  });

  const orderStatusData = [
    { name: 'Completed', value: completedOrders },
    { name: 'Processing', value: processingOrders },
    { name: 'Pending', value: pendingOrders },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ];

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Vendor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name || 'Vendor'}. Here&apos;s your store overview.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{p === 'all' ? 'All Time' : p}</button>
          ))}
        </div>
      </div>

      {/* Store Status Banner */}
      {vendor && (
        <div className={`rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${vendor.kyc_status === 'VERIFIED' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{vendor.kyc_status === 'VERIFIED' ? '✅' : '⏳'}</span>
            <div>
              <p className="font-semibold text-ob-navy text-sm">{vendor.store_name}</p>
              <p className="text-xs text-gray-500">KYC: {vendor.kyc_status?.replace(/_/g, ' ')} | Bank: {vendor.bank_verification_status?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/vendor-dashboard/kyc" className="text-xs font-medium text-ob-purple hover:underline">KYC Status →</Link>
            <Link href="/vendor-dashboard/products" className="text-xs font-medium text-green-600 hover:underline">Add Product →</Link>
          </div>
        </div>
      )}

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Revenue" value={`₦${totalRevenue.toLocaleString()}`} color="text-green-600" />
        <StatCard title="Orders" value={orders.length} color="text-ob-purple" />
        <StatCard title="Commission" value={`₦${commission.toLocaleString()}`} color="text-amber-600" />
        <StatCard title="Net Earnings" value={`₦${(totalRevenue - commission).toLocaleString()}`} color="text-blue-600" />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Products" value={products.length} color="text-ob-navy" />
        <StatCard title="Pending Orders" value={pendingOrders} color={pendingOrders > 0 ? 'text-amber-600' : 'text-green-600'} />
        <StatCard title="Rating" value={vendor?.average_rating ? `⭐ ${Number(vendor.average_rating).toFixed(1)}` : '—'} color="text-amber-600" />
        <StatCard title="Store Views" value={vendor?.store_views || 0} color="text-blue-600" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Revenue Trend</h3>
          <DashboardBarChart data={revenueByMonth} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Order Status</h3>
          <DashboardPieChart data={orderStatusData} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Add Product', href: '/vendor-dashboard/products', icon: '➕', color: 'bg-green-50 text-green-600' },
          { label: 'Manage Orders', href: '/vendor-dashboard/orders', icon: '📦', color: 'bg-blue-50 text-blue-600' },
          { label: 'Inventory', href: '/vendor-dashboard/inventory', icon: '📋', color: 'bg-amber-50 text-amber-600' },
          { label: 'Analytics', href: '/vendor-dashboard/analytics', icon: '📊', color: 'bg-ob-purple/10 text-ob-purple' },
          { label: 'Payouts', href: '/vendor-dashboard/payouts', icon: '💰', color: 'bg-green-50 text-green-600' },
          { label: 'Reviews', href: '/vendor-dashboard/reviews', icon: '⭐', color: 'bg-amber-50 text-amber-600' },
          { label: 'Store Settings', href: '/vendor-dashboard/store', icon: '🏪', color: 'bg-blue-50 text-blue-600' },
          { label: 'KYC', href: '/vendor-dashboard/kyc', icon: '🔐', color: 'bg-ob-purple/10 text-ob-purple' },
        ].map((action, i) => (
          <Link key={i} href={action.href} className="p-4 rounded-xl border border-gray-100 hover:border-ob-purple/30 hover:bg-ob-purple/5 transition-all text-center">
            <span className="text-2xl">{action.icon}</span>
            <p className="text-xs font-medium text-ob-navy mt-2">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ob-navy">Recent Orders</h3>
          <Link href="/vendor-dashboard/orders" className="text-ob-purple text-xs font-medium hover:underline">View All →</Link>
        </div>
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin h-6 w-6 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
        ) : orders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No orders yet. Orders will appear here as customers purchase your products.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-ob-navy">{o.order_number}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ob-navy">₦{Number(o.total || 0).toLocaleString()}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    o.status === 'completed' || o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{(o.status || 'pending').replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
