'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AccountOrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    fetch('/api/orders?limit=50').then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-screen bg-ob-light flex items-center justify-center"><div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" /></div>;

  const statusColor = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-gray-300 text-sm mt-1">Track your orders and delivery status.</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 text-center">
              <p className="text-gray-500 text-lg mb-2">No orders yet</p>
              <p className="text-gray-400 text-sm mb-6">When you place an order, it will appear here.</p>
              <Link href="/shop" className="btn-primary px-8 py-3">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-xl border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="font-bold text-ob-navy">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[order.status]}`}>{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">₦{Number(order.total || 0).toLocaleString()}</p>
                    <span className="text-xs text-gray-400">Tracking coming soon</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
