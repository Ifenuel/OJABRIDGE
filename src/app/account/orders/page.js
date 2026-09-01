'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [showDispute, setShowDispute] = useState(null);
  const [disputeForm, setDisputeForm] = useState({ reason: '', description: '' });
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?limit=50');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {}
    setLoading(false);
  };

  const loadOrderItems = async (orderId) => {
    if (orderItems[orderId]) { setExpandedOrder(expandedOrder === orderId ? null : orderId); return; }
    try {
      const res = await fetch(`/api/orders?limit=100`);
      const data = await res.json();
      const order = data.orders?.find(o => o.id === orderId);
      if (order) {
        setOrderItems(prev => ({ ...prev, [orderId]: order }));
        setExpandedOrder(orderId);
      }
    } catch (e) {}
  };

  const cancelOrder = async (orderId) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'cancelled' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Order cancelled successfully' });
        loadOrders();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusColor = (s) => ({
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700', completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your orders.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white p-6 rounded-xl border border-gray-100"><div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mb-3" /><div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" /></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-400 text-sm">No orders found.</p>
          <Link href="/shop" className="text-ob-purple text-sm font-semibold mt-2 inline-block hover:underline">Browse Products →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const shippingAddr = (() => { try { return typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address || {}; } catch { return {}; } })();
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ob-navy">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    {shippingAddr.name && <p className="text-xs text-gray-500 mt-1">Ship to: {shippingAddr.name}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-ob-navy">₦{Number(order.total).toLocaleString()}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>{order.status}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{order.payment_status}</span>
                  </div>
                </div>
                <div className="px-6 pb-4 flex gap-2">
                  <button onClick={() => loadOrderItems(order.id)} className="text-ob-purple text-xs font-medium hover:underline">
                    {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                  </button>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button onClick={() => cancelOrder(order.id)} className="text-red-500 text-xs font-medium hover:underline">Cancel Order</button>
                  )}
                  {['delivered', 'completed', 'shipped'].includes(order.status) && (
                    <button onClick={() => setShowDispute(showDispute === order.id ? null : order.id)} className="text-amber-600 text-xs font-medium hover:underline">Open Dispute</button>
                  )}
                </div>
                {showDispute === order.id && (
                  <div className="border-t border-amber-100 p-6 bg-amber-50">
                    <p className="text-sm font-bold text-ob-navy mb-3">Open a Dispute for {order.order_number}</p>
                    <input type="text" value={disputeForm.reason} onChange={e => setDisputeForm({...disputeForm, reason: e.target.value})} placeholder="Reason (e.g. Wrong item received)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm mb-3 focus:border-ob-purple outline-none" />
                    <textarea rows={3} value={disputeForm.description} onChange={e => setDisputeForm({...disputeForm, description: e.target.value})} placeholder="Describe the issue in detail..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm mb-3 focus:border-ob-purple outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        if (!disputeForm.reason || !disputeForm.description) return;
                        setDisputeSubmitting(true);
                        try {
                          const res = await fetch('/api/disputes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: order.id, reason: disputeForm.reason, description: disputeForm.description }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setMessage({ type: 'success', text: 'Dispute opened. Our team will review it shortly.' });
                            setShowDispute(null);
                            setDisputeForm({ reason: '', description: '' });
                            loadOrders();
                          } else {
                            setMessage({ type: 'error', text: data.error || data.errors?.join(', ') || 'Failed' });
                          }
                        } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
                        setDisputeSubmitting(false);
                        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
                      }} disabled={disputeSubmitting || !disputeForm.reason || !disputeForm.description} className="bg-amber-600 text-white px-4 py-2 text-xs rounded-lg font-medium disabled:opacity-50">
                        {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
                      </button>
                      <button onClick={() => { setShowDispute(null); setDisputeForm({ reason: '', description: '' }); }} className="text-gray-500 text-xs px-4 py-2">Cancel</button>
                    </div>
                  </div>
                )}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Payment Status</p>
                        <p className="text-sm font-medium">{order.payment_status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Subtotal</p>
                        <p className="text-sm">₦{Number(order.subtotal || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Shipping</p>
                        <p className="text-sm">₦{Number(order.shipping_cost || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Total</p>
                        <p className="text-sm font-bold">₦{Number(order.total).toLocaleString()}</p>
                      </div>
                    </div>
                    {shippingAddr.address && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-400 mb-1">Shipping Address</p>
                        <p className="text-sm">{shippingAddr.address}{shippingAddr.city ? `, ${shippingAddr.city}` : ''}{shippingAddr.state ? `, ${shippingAddr.state}` : ''}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
