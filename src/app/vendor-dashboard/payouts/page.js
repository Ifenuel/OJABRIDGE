'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, vendorsRes] = await Promise.allSettled([
          fetch('/api/orders?limit=200').then(r => r.json()),
          fetch('/api/vendors?limit=10').then(r => r.json()),
        ]);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) setOrders(ordersRes.value.orders || []);
        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.success) {
          const myVendor = vendorsRes.value.vendors?.find(v => v.user_id === user?.id);
          setVendor(myVendor || null);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    if (user) loadData();
  }, [user]);

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const netEarnings = totalRevenue - commission;
  const pendingEarnings = paidOrders.filter(o => ['processing', 'shipped', 'in_transit'].includes(o.status)).reduce((sum, o) => sum + (Number(o.total || 0) * 0.9), 0);
  const settledEarnings = paidOrders.filter(o => ['delivered', 'completed'].includes(o.status)).reduce((sum, o) => sum + (Number(o.total || 0) * 0.9), 0);

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Payouts & Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Track your earnings, pending settlements and settlement history.</p>
      </div>

      {/* Wallet Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-ob-purple to-ob-purple-dark p-6 rounded-2xl text-white">
          <p className="text-purple-200 text-sm">Available Balance</p>
          <p className="text-3xl font-bold mt-1">₦{Math.round(settledEarnings).toLocaleString()}</p>
          <p className="text-purple-300 text-xs mt-2">Ready for withdrawal</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Pending Earnings</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">₦{Math.round(pendingEarnings).toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-2">Awaiting delivery confirmation</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Earned</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₦{Math.round(netEarnings).toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-2">After 10% platform commission</p>
        </div>
      </div>

      {/* Commission Info */}
      <div className="bg-ob-light rounded-xl p-6 border border-gray-100 mb-8">
        <div className="flex items-start gap-4">
          <span className="text-2xl">💰</span>
          <div>
            <h3 className="font-bold text-ob-navy mb-1">How Payouts Work</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              OjaBridge charges a <strong>10% platform commission</strong> on each successful transaction. The remaining 90% is your payout. When a customer places an order and payment is verified, your share (90%) enters <strong>Pending Vendor Earnings</strong> until the order is delivered. After delivery confirmation, the funds become eligible for settlement to your bank account.
            </p>
          </div>
        </div>
      </div>

      {/* Settlement History */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-ob-navy">Recent Orders & Earnings</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
        ) : paidOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No settlements yet.</p>
            <p className="text-gray-300 text-xs mt-1">Settlement records will appear here after your first sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Your Payout (90%)</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.slice(0, 20).map(o => {
                  const amount = Number(o.total || 0);
                  const vendorPayout = Math.round(amount * 0.9);
                  const isSettled = ['delivered', 'completed'].includes(o.status);
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-ob-navy">{o.order_number}</td>
                      <td className="px-6 py-4 text-sm">₦{amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">₦{vendorPayout.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isSettled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isSettled ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
