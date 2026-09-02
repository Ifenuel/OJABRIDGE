'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const [ordersRes, productsRes] = await Promise.allSettled([
          fetch('/api/orders?limit=500').then(r => r.json()),
          fetch('/api/products?limit=200').then(r => r.json()),
        ]);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (productsRes.status === 'fulfilled' && productsRes.value.success) setProducts(productsRes.value.products || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadData();
  }, [user]);

  // Filter by period
  const now = new Date();
  const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : period === '12m' ? 365 : 30;
  const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const periodOrders = orders.filter(o => new Date(o.created_at) >= cutoff);
  const paidOrders = periodOrders.filter(o => o.payment_status === 'paid');

  // Stats
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const netEarnings = totalRevenue - commission;
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const completedOrders = periodOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const conversionRate = products.length > 0 ? ((paidOrders.length / products.length) * 100).toFixed(1) : '0.0';

  // Monthly revenue chart (real data)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), i, 1).toLocaleString('en', { month: 'short' });
    const mOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear() && o.payment_status === 'paid';
    });
    return { name: month, value: mOrders.reduce((s, o) => s + Number(o.total || 0), 0) };
  });
  const maxRevenue = Math.max(...monthlyData.map(d => d.value), 1);

  // Order status breakdown
  const orderStatusData = [
    { name: 'Completed', value: periodOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length },
    { name: 'Processing', value: periodOrders.filter(o => o.status === 'processing' || o.status === 'shipped').length },
    { name: 'Pending', value: periodOrders.filter(o => o.status === 'pending').length },
    { name: 'Cancelled', value: periodOrders.filter(o => o.status === 'cancelled').length },
  ];

  if (loading) {
    return (
      <DashboardLayout role="vendor">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="vendor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Insights into your store performance and sales trends.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '12m'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, sub: `${paidOrders.length} paid orders`, color: 'text-ob-purple' },
          { label: 'Orders', value: periodOrders.length, sub: `${completedOrders} completed`, color: 'text-blue-600' },
          { label: 'Avg Order Value', value: `₦${avgOrderValue.toLocaleString()}`, sub: 'Per order', color: 'text-ob-lime-dark' },
          { label: 'Net Earnings', value: `₦${netEarnings.toLocaleString()}`, sub: `After ${commission.toLocaleString()} commission`, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
        <h3 className="font-bold text-ob-navy mb-6">Revenue Trend (This Year)</h3>
        <div className="flex items-end justify-between h-48 px-4">
          {monthlyData.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 max-w-16">
              <span className="text-[10px] text-gray-400 mb-1">
                {d.value > 0 ? `₦${(d.value / 1000).toFixed(0)}k` : ''}
              </span>
              <div className="w-full bg-ob-purple/10 rounded-t relative" style={{ height: `${Math.max((d.value / maxRevenue) * 140, 4)}px` }}>
                <div className="absolute bottom-0 w-full bg-ob-purple rounded-t transition-all duration-500" style={{ height: '100%' }} />
              </div>
              <span className="text-[10px] text-gray-400 mt-1">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Order Status</h3>
          {orderStatusData.every(d => d.value === 0) ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet. Data will appear once you receive orders.</p>
          ) : (
            <div className="space-y-3">
              {orderStatusData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{d.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${periodOrders.length > 0 ? (d.value / periodOrders.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-medium text-ob-navy w-8 text-right">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Products Overview</h3>
          {products.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No products yet. Add your first product to start selling.</p>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-ob-purple/10 rounded-lg flex items-center justify-center text-xs font-bold text-ob-purple">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ob-navy">{p.name}</p>
                      <p className="text-xs text-gray-400">₦{Number(p.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${(p.stock || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {(p.stock || 0) > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
