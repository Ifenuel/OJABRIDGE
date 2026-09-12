'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exportData, filterByDateRange, formatDate, formatCurrency } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';
import ActionMenu from '@/components/ActionMenu';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?limit=50');
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) loadOrders();
    } catch (err) { console.error(err); }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and fulfill your customer orders.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: orders.length, color: 'text-ob-navy' },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: 'text-blue-600' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">Orders ({filteredOrders.length})</h3>
          <ExportButton
            dateRangeOptions={dateRangeOptions}
            onExport={({ format, dateRange }) => {
              const exportOrders = dateRange ? filterByDateRange(filteredOrders, dateRange.start, dateRange.end, 'created_at') : filteredOrders;
              exportData({
                format,
                title: 'Vendor Orders Report',
                filename: 'ojabridge_vendor_orders',
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
        <div className="overflow-x-auto">
          <table className="w-full table-mobile-responsive">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
                    No orders found. Orders will appear here when customers purchase your products.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-ob-navy">{order.order_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(() => { try { const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address; return addr?.name || 'Customer'; } catch { return 'Customer'; } })()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-ob-navy">₦{Number(order.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ActionMenu
                        label="Actions ▾"
                        actions={[
                          { label: 'View Details', icon: '👁️', className: 'text-ob-purple', onClick: () => setSelectedOrder(order) },
                          { label: order.status === 'confirmed' ? 'Mark as Processing' : order.status === 'processing' ? 'Mark as Shipped' : null, icon: order.status === 'confirmed' ? '🔄' : '🚚', className: order.status === 'confirmed' ? 'text-blue-600' : 'text-indigo-600', hidden: !(order.status === 'confirmed' || order.status === 'processing'), onClick: () => updateOrderStatus(order.id, order.status === 'confirmed' ? 'processing' : 'shipped') },
                          { label: 'View in Shop', icon: '🌐', className: 'text-green-600', onClick: () => window.open(`/vendor/${order.vendor_slug || ''}`, '_blank') },
                        ].filter(Boolean)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-ob-navy">Order {selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Status</p><span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
                <div><p className="text-xs text-gray-400">Payment</p><span className={`text-xs font-medium px-2 py-1 rounded-full ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{selectedOrder.payment_status}</span></div>
                <div><p className="text-xs text-gray-400">Total</p><p className="font-bold text-ob-navy">₦{Number(selectedOrder.total).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-400">Date</p><p className="text-sm text-gray-600">{new Date(selectedOrder.created_at).toLocaleDateString()}</p></div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2">Shipping To</p>
                {(() => { try { const addr = typeof selectedOrder.shipping_address === 'string' ? JSON.parse(selectedOrder.shipping_address) : selectedOrder.shipping_address || {}; return (
                  <>
                    <p className="text-sm text-ob-navy">{addr.name || 'Customer'}</p>
                    <p className="text-sm text-gray-600">{addr.email || ''}</p>
                    <p className="text-sm text-gray-600">{addr.address || ''}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''}</p>
                    {addr.phone && <p className="text-sm text-gray-600">{addr.phone}</p>}
                  </>
                ); } catch { return <p className="text-sm text-gray-600">No address</p>; } })()}
              </div>
              <div className="border-t border-gray-100 pt-4 flex gap-3">
                {selectedOrder.status === 'confirmed' && (
                  <button onClick={() => { updateOrderStatus(selectedOrder.id, 'processing'); setSelectedOrder(null); }} className="btn-primary px-4 py-2 text-sm">Mark as Processing</button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button onClick={() => { updateOrderStatus(selectedOrder.id, 'shipped'); setSelectedOrder(null); }} className="btn-primary px-4 py-2 text-sm">Mark as Shipped</button>
                )}
                <button onClick={() => setSelectedOrder(null)} className="border border-gray-200 px-4 py-2 text-sm rounded-lg text-gray-600 hover:border-ob-purple">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
