'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

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
        <div className="overflow-x-auto">
          <table className="w-full">
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
                    <td className="px-6 py-4 text-sm text-gray-600">{order.shipping_name || 'Customer'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-ob-navy">₦{Number(order.total_amount).toLocaleString()}</td>
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
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setSelectedOrder(order)} className="text-ob-purple text-xs font-medium hover:underline">View</button>
                        {order.status === 'confirmed' && (
                          <button onClick={() => updateOrderStatus(order.id, 'processing')} className="text-blue-600 text-xs font-medium hover:underline">Process</button>
                        )}
                        {order.status === 'processing' && (
                          <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="text-indigo-600 text-xs font-medium hover:underline">Ship</button>
                        )}
                      </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Status</p><span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
                <div><p className="text-xs text-gray-400">Payment</p><span className={`text-xs font-medium px-2 py-1 rounded-full ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{selectedOrder.payment_status}</span></div>
                <div><p className="text-xs text-gray-400">Total</p><p className="font-bold text-ob-navy">₦{Number(selectedOrder.total_amount).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-400">Date</p><p className="text-sm text-gray-600">{new Date(selectedOrder.created_at).toLocaleDateString()}</p></div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2">Shipping To</p>
                <p className="text-sm text-ob-navy">{selectedOrder.shipping_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shipping_email}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
                {selectedOrder.shipping_phone && <p className="text-sm text-gray-600">{selectedOrder.shipping_phone}</p>}
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
