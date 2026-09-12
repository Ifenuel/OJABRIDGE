'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exportData, filterByDateRange, formatDate, formatCurrency } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';
import DataTable from '@/components/DataTable';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetch('/api/orders?limit=100').then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const statusColor = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <DashboardLayout role="admin" requiredPermission="orders">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Orders</h1><p className="text-gray-500 text-sm mt-1">Monitor and manage all marketplace orders.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{ l: 'Total', v: orders.length, c: 'text-ob-navy' }, { l: 'Pending', v: orders.filter(o => o.status === 'pending').length, c: 'text-amber-600' }, { l: 'Active', v: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length, c: 'text-blue-600' }, { l: 'Completed', v: orders.filter(o => o.status === 'delivered').length, c: 'text-green-600' }].map((s, i) => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs text-gray-500">{s.l}</p><p className={`text-xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">{['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">All Orders ({filtered.length})</h3>
          <ExportButton
            dateRangeOptions={dateRangeOptions}
            onExport={({ format, dateRange }) => {
              const exportOrders = dateRange ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'created_at') : filtered;
              exportData({
                format,
                title: 'Orders Report',
                filename: 'ojabridge_orders',
                dateRange,
                summary: [
                  { label: 'Total Orders', value: orders.length },
                  { label: 'Exported', value: exportOrders.length },
                ],
                columns: [
                  { key: 'order_number', label: 'Order Number' },
                  { key: 'customer', label: 'Customer' },
                  { key: 'total', label: 'Amount', format: (v) => formatCurrency(v) },
                  { key: 'payment_status', label: 'Payment Status' },
                  { key: 'status', label: 'Order Status' },
                  { key: 'created_at', label: 'Date', format: (v) => formatDate(v) },
                ],
                rows: exportOrders.map(o => ({
                  order_number: o.order_number,
                  customer: (() => { try { const a = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address; return a?.name || '—'; } catch { return '—'; } })(),
                  total: o.total,
                  payment_status: o.payment_status,
                  status: o.status,
                  created_at: o.created_at,
                })),
              });
            }}
          />
        </div>
        <DataTable
          columns={[
            { key: 'order_number', label: 'Order ID', render: o => <span className="font-medium text-ob-navy">{o.order_number}</span> },
            { key: 'customer', label: 'Customer', render: o => { try { const a = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address; return a?.name || '—'; } catch { return '—'; } } },
            { key: 'total', label: 'Amount', render: o => <span className="font-semibold">₦{Number(o.total).toLocaleString()}</span> },
            { key: 'payment_status', label: 'Payment', render: o => <span className={`text-xs px-2 py-1 rounded-full ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.payment_status}</span> },
            { key: 'status', label: 'Status', render: o => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span> },
            { key: 'created_at', label: 'Date', render: o => new Date(o.created_at).toLocaleDateString() },
          ]}
          rows={loading ? [] : filtered}
          emptyMessage={loading ? 'Loading orders…' : 'No orders found.'}
        />
      </div>
    </DashboardLayout>
  );
}
