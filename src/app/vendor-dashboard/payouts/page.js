'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const [walletRes, settleRes, vendorRes] = await Promise.allSettled([
          fetch('/api/settlements').then(r => r.json()),
          fetch('/api/settlements').then(r => r.json()),
          fetch('/api/vendors?limit=10').then(r => r.json()),
        ]);

        if (walletRes.status === 'fulfilled') {
          const data = walletRes.value;
          setWallet(data.settlements || data.wallet || []);
        }
        if (settleRes.status === 'fulfilled') {
          setSettlements(settleRes.value.settlements || []);
        }
        if (vendorRes.status === 'fulfilled') {
          const myVendor = vendorRes.value.vendors?.find(v => v.user_id === user?.id);
          setVendor(myVendor || null);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    loadData();
  }, [user]);

  // Compute real wallet data
  const pendingBalance = wallet
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const settledBalance = wallet
    .filter(w => w.status === 'settled' || w.status === 'completed')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const totalEarnings = pendingBalance + settledBalance;
  const totalCommission = wallet.reduce((sum, w) => sum + Number(w.commission_amount || 0), 0);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    if (amount > pendingBalance) {
      setMessage({ type: 'error', text: `Insufficient balance. Available: ₦${pendingBalance.toLocaleString()}` });
      return;
    }
    if (!vendor?.bank_account_number) {
      setMessage({ type: 'error', text: 'Please add your bank account in KYC settings first.' });
      return;
    }

    setWithdrawing(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'NGN' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Withdrawal request of ₦${amount.toLocaleString()} submitted. Funds will arrive in 1-2 business days.` });
        setShowWithdraw(false);
        setWithdrawAmount('');
        // Refresh wallet data
        const freshRes = await fetch('/api/settlements').then(r => r.json());
        setWallet(freshRes.settlements || freshRes.wallet || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Withdrawal failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setWithdrawing(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Payouts & Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Track your earnings, pending settlements and withdrawal history.</p>
      </div>

      {/* Wallet Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-ob-purple to-ob-purple-dark p-6 rounded-2xl text-white">
          <p className="text-purple-200 text-sm">Available for Withdrawal</p>
          <p className="text-3xl font-bold mt-1">₦{Math.round(pendingBalance).toLocaleString()}</p>
          <p className="text-purple-300 text-xs mt-2">From delivered/completed orders</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Settled</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₦{Math.round(settledBalance).toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-2">Already transferred to bank</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Platform Commission</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">₦{Math.round(totalCommission).toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-2">10% on each transaction</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={pendingBalance <= 0}
          className="bg-ob-lime hover:bg-ob-lime-dark text-ob-navy font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Withdraw Funds
        </button>
        {!vendor?.bank_account_number && (
          <a href="/vendor-dashboard/kyc" className="text-sm text-ob-purple hover:underline flex items-center gap-1">
            ⚠️ Add bank account in KYC settings to enable withdrawals
          </a>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !withdrawing && setShowWithdraw(false)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10">
            <h3 className="text-lg font-bold text-ob-navy mb-2">Withdraw Funds</h3>
            <p className="text-gray-500 text-sm mb-4">Available: ₦{Math.round(pendingBalance).toLocaleString()}</p>

            {vendor?.bank_account_number ? (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400">Sending to</p>
                <p className="text-sm font-medium text-ob-navy">{vendor.bank_name} •••{vendor.bank_account_number?.slice(-4)}</p>
                <p className="text-xs text-gray-400">{vendor.bank_account_name}</p>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-3 mb-4 text-sm text-red-600">
                No bank account added. Please add one in KYC settings first.
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                max={pendingBalance}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold focus:border-ob-purple outline-none"
              />
              <div className="flex gap-2 mt-2">
                {[1000, 5000, 10000].filter(amt => amt <= pendingBalance).map(amt => (
                  <button key={amt} onClick={() => setWithdrawAmount(String(amt))}
                    className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200">
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
                <button onClick={() => setWithdrawAmount(String(Math.round(pendingBalance)))}
                  className="px-3 py-1 bg-ob-purple/10 rounded-lg text-xs font-medium text-ob-purple hover:bg-ob-purple/20">
                  Max
                </button>
              </div>
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowWithdraw(false)} disabled={withdrawing}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}
                className="flex-1 py-3 bg-ob-purple text-white rounded-xl text-sm font-bold hover:bg-ob-purple-dark disabled:opacity-50">
                {withdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How Payouts Work */}
      <div className="bg-ob-light rounded-xl p-6 border border-gray-100 mb-8">
        <div className="flex items-start gap-4">
          <span className="text-2xl">💰</span>
          <div>
            <h3 className="font-bold text-ob-navy mb-1">How Payouts Work</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              When a customer pays, the money goes to OjaBridge. After order delivery, your 90% share becomes available for withdrawal. Click &quot;Withdraw Funds&quot; to transfer money to your bank account (1-2 business days). OjaBridge charges 10% commission per transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Settlement History */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-ob-navy">Settlement History</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
        ) : wallet.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No earnings yet.</p>
            <p className="text-gray-300 text-xs mt-1">Earnings will appear here after your first sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Gross Amount</th>
                  <th className="px-6 py-4 font-medium">Commission</th>
                  <th className="px-6 py-4 font-medium">Your Payout</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {wallet.slice(0, 20).map(w => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-700',
                    settled: 'bg-green-100 text-green-700',
                    completed: 'bg-green-100 text-green-700',
                    processing: 'bg-blue-100 text-blue-700',
                    failed: 'bg-red-100 text-red-700',
                  };
                  return (
                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-ob-navy">
                        {w.order_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">₦{Number(w.amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-amber-600">₦{Number(w.commission_amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ₦{Number(w.amount - (w.commission_amount || 0)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[w.status] || 'bg-gray-100 text-gray-600'}`}>
                          {(w.status || 'pending').charAt(0).toUpperCase() + (w.status || 'pending').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {message.text && !showWithdraw && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl text-sm shadow-lg z-50 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}
    </DashboardLayout>
  );
}
