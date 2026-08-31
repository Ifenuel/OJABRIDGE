'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetch('/api/orders?limit=100').then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const statusColor = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Orders</h1><p className="text-gray-500 text-sm mt-1">Monitor and manage all marketplace orders.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{ l: 'Total', v: orders.length, c: 'text-ob-navy' }, { l: 'Pending', v: orders.filter(o => o.status === 'pending').length, c: 'text-amber-600' }, { l: 'Active', v: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length, c: 'text-blue-600' }, { l: 'Completed', v: orders.filter(o => o.status === 'delivered').length, c: 'text-green-600' }].map((s, i) => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs text-gray-500">{s.l}</p><p className={`text-xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">{['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="px-6 py-4 font-medium">Order ID</th><th className="px-6 py-4 font-medium">Customer</th><th className="px-6 py-4 font-medium">Amount</th><th className="px-6 py-4 font-medium">Payment</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Date</th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : filtered.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 text-sm">No orders found.</td></tr> : filtered.map(o => <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium text-ob-navy">{o.order_number}</td><td className="px-6 py-4 text-sm text-gray-600">{o.shipping_name || '—'}</td><td className="px-6 py-4 text-sm font-semibold">₦{Number(o.total_amount).toLocaleString()}</td><td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.payment_status}</span></td><td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span></td><td className="px-6 py-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
