'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, pendingEarnings: 0, totalPaid: 0 });

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
          <p className="text-3xl font-bold mt-1">₦{wallet.balance.toLocaleString()}</p>
          <p className="text-purple-300 text-xs mt-2">Ready for withdrawal</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Pending Earnings</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">₦{wallet.pendingEarnings.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-2">Pending delivery confirmation</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Paid Out</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₦{wallet.totalPaid.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-2">All-time settlements</p>
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
          <h3 className="font-bold text-ob-navy">Settlement History</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No settlements yet.</p>
          <p className="text-gray-300 text-xs mt-1">Settlement records will appear here after your first sales.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
