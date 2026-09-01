'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminSettlementsPage() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, vendorsRes] = await Promise.allSettled([
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/vendors?limit=100').then(r => r.json()),
        ]);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.success) setVendors(vendorsRes.value.vendors || []);
      } catch (err) {}
      setLoading(false);
    }
    loadData();
  }, []);

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalCommission = Math.round(totalRevenue * 0.10);
  const totalVendorPayout = totalRevenue - totalCommission;
  const pendingPayout = paidOrders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).reduce((sum, o) => sum + Number(o.total || 0) * 0.9, 0);
  const settledPayout = paidOrders.filter(o => ['delivered', 'completed'].includes(o.status)).reduce((sum, o) => sum + Number(o.total || 0) * 0.9, 0);

  const statusColor = (s) => ({
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700', completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Settlements</h1>
        <p className="text-gray-500 text-sm mt-1">Track vendor payouts, commissions and settlement history.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Total Revenue', v: `₦${totalRevenue.toLocaleString()}`, c: 'text-ob-purple' },
          { l: 'Platform Commission (10%)', v: `₦${totalCommission.toLocaleString()}`, c: 'text-green-600' },
          { l: 'Pending Vendor Payout', v: `₦${Math.round(pendingPayout).toLocaleString()}`, c: 'text-amber-600' },
          { l: 'Settled to Vendors', v: `₦${Math.round(settledPayout).toLocaleString()}`, c: 'text-blue-600' },
        ].map((s, i) => <div key={i} className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">{s.l}</p><p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>

      {/* Commission Explainer */}
      <div className="bg-ob-purple/5 border border-ob-purple/20 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-ob-navy mb-2">How Settlements Work</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          When a customer pays, OjaBridge holds the full amount. <strong>10% is retained as platform commission</strong>. The remaining 90% enters the vendor&apos;s pending balance. Once the order is <strong>delivered or completed</strong>, the vendor&apos;s share becomes eligible for settlement to their bank account via Paystack transfer.
        </p>
      </div>

      {/* Vendor Summary */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-ob-navy">Vendor Balances</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Vendor</th>
                <th className="px-6 py-4 font-medium">Total Earnings</th>
                <th className="px-6 py-4 font-medium">Pending</th>
                <th className="px-6 py-4 font-medium">Settled</th>
                <th className="px-6 py-4 font-medium">Commission Paid</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : vendors.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No vendors yet.</td></tr>
              ) : vendors.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-ob-navy">{v.store_name}</p>
                    <p className="text-xs text-gray-400">{v.owner_name || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-ob-navy">₦{Number(v.total_earnings || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-amber-600">₦{Number(v.pending_earnings || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-green-600">₦{Number(v.settled_earnings || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">₦{Number(v.total_commission_paid || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Settlement-Eligible Orders */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-ob-navy">Recent Paid Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Commission</th>
                <th className="px-6 py-4 font-medium">Vendor Payout</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : paidOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No paid orders yet.</td></tr>
              ) : paidOrders.slice(0, 20).map(o => {
                const total = Number(o.total || 0);
                const comm = Math.round(total * 0.10);
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-ob-navy">{o.order_number}</td>
                    <td className="px-6 py-4 text-sm font-semibold">₦{total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-amber-600">₦{comm.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-green-600">₦{(total - comm).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(o.status)}`}>{o.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
