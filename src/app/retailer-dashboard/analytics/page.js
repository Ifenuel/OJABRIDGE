'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { exportCsv, formatDate, formatCurrency } from '@/lib/csvExport';

export default function RetailerAnalyticsPage() {
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
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const completedOrders = periodOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;

  // Top categories
  const categoryStats = {};
  products.forEach(p => {
    const cat = p.category || 'Other';
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout role="retailer">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="retailer">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Insights into your sourcing and purchase activity.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['7d', '30d', '90d', '12m'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '12 Months'}
            </button>
          ))}
          <button onClick={() => exportCsv({
            title: `Retailer Analytics Report (${period})`,
            filename: 'ojabridge_retailer_analytics',
            summary: [
              { label: 'Period', value: period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : period === '90d' ? 'Last 90 Days' : 'Last 12 Months' },
              { label: 'Total GMV', value: formatCurrency(totalRevenue) },
              { label: 'Total Orders', value: periodOrders.length },
              { label: 'Avg Order Value', value: formatCurrency(avgOrderValue) },
            ],
            columns: [
              { key: 'order_number', label: 'Order Number' },
              { key: 'total', label: 'Amount', format: v => formatCurrency(v) },
              { key: 'payment_status', label: 'Payment' },
              { key: 'status', label: 'Status' },
              { key: 'created_at', label: 'Date', format: v => formatDate(v) },
            ],
            rows: periodOrders.map(o => ({
              order_number: o.order_number,
              total: o.total,
              payment_status: o.payment_status,
              status: o.status,
              created_at: o.created_at,
            })),
          })} className="flex items-center gap-2 px-4 py-2 bg-ob-purple text-white rounded-lg text-xs font-medium hover:bg-ob-purple-dark transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Marketplace GMV', value: formatCurrency(totalRevenue), sub: `${paidOrders.length} paid orders`, color: 'text-ob-purple' },
          { label: 'Orders (This Period)', value: periodOrders.length, sub: `${completedOrders} completed`, color: 'text-blue-600' },
          { label: 'Avg Order Value', value: formatCurrency(avgOrderValue), sub: 'Per order', color: 'text-ob-lime-dark' },
          { label: 'Products Available', value: products.length, sub: `${topCategories.length} categories`, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Top Categories */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
        <h3 className="font-bold text-ob-navy mb-4">Product Categories</h3>
        {topCategories.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No product categories yet. Data will appear once vendors list products.</p>
        ) : (
          <div className="space-y-3">
            {topCategories.map(([cat, count], i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{cat}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div className="bg-ob-purple h-2 rounded-full" style={{ width: `${(count / Math.max(...topCategories.map(c => c[1]))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-ob-navy w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        <h3 className="font-bold text-ob-navy mb-4">Recent Orders ({periodOrders.length})</h3>
        {periodOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No orders in this period.</p>
        ) : (
          <div className="space-y-3">
            {periodOrders.slice(0, 10).map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-ob-navy">{o.order_number}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ob-navy">₦{Number(o.total || 0).toLocaleString()}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    o.status === 'completed' || o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
