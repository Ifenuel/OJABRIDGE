'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?limit=200')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const pendingSettlements = paidOrders.filter(o => ['processing', 'shipped', 'in_transit'].includes(o.status)).reduce((sum, o) => sum + Number(o.total || 0) * 0.9, 0);
  const failedPayments = orders.filter(o => o.payment_status === 'failed').length;

  const statusColor = (s) => ({
    paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Payments & Transactions</h1><p className="text-gray-500 text-sm mt-1">Monitor all payment transactions, commissions and financial activity.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Total Revenue', v: `₦${totalRevenue.toLocaleString()}`, c: 'text-ob-purple' },
          { l: 'Commission Earned', v: `₦${commission.toLocaleString()}`, c: 'text-green-600' },
          { l: 'Pending Settlements', v: `₦${Math.round(pendingSettlements).toLocaleString()}`, c: 'text-amber-600' },
          { l: 'Failed Payments', v: failedPayments, c: 'text-red-600' },
        ].map((s, i) => <div key={i} className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">{s.l}</p><p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-ob-navy">Transaction History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Commission (10%)</th>
                <th className="px-6 py-4 font-medium">Vendor Payout</th>
                <th className="px-6 py-4 font-medium">Payment Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : paidOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No transactions yet. Payments will appear here once orders are placed.</td></tr>
              ) : paidOrders.map(o => {
                const amount = Number(o.total || 0);
                const comm = Math.round(amount * 0.10);
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-ob-navy">{o.order_number}</td>
                    <td className="px-6 py-4 text-sm font-semibold">₦{amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-amber-600">₦{comm.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-green-600">₦{(amount - comm).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(o.payment_status)}`}>{o.payment_status}</span></td>
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
