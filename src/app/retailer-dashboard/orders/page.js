'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { exportCsv, formatDate, formatCurrency } from '@/lib/csvExport';

export default function RetailerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetch('/api/orders?limit=200')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your product orders.</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'processing', 'shipped', 'delivered'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-ob-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={() => exportCsv({
          title: 'Retailer Orders Report',
          filename: 'ojabridge_retailer_orders',
          summary: [
            { label: 'Total Orders', value: orders.length },
            { label: 'Filtered', value: filtered.length },
          ],
          columns: [
            { key: 'order_number', label: 'Order Number' },
            { key: 'total', label: 'Amount', format: v => formatCurrency(v) },
            { key: 'payment_status', label: 'Payment Status' },
            { key: 'status', label: 'Order Status' },
            { key: 'created_at', label: 'Date', format: v => formatDate(v) },
          ],
          rows: filtered.map(o => ({
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

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500 text-sm">No orders found.</p>
          <Link href="/shop" className="text-ob-purple text-sm font-semibold hover:underline mt-2 inline-block">Browse Products →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-gray-500">{order.order_number}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{(order.status || 'pending').replace('_', ' ')}</span>
              </div>
              <p className="text-ob-navy font-semibold">₦{Number(order.total || 0).toLocaleString()}</p>
              <p className="text-gray-400 text-xs mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
