'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminPaymentsPage() {
  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Payments & Transactions</h1><p className="text-gray-500 text-sm mt-1">Monitor all payment transactions, commissions and financial activity.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ l: 'Total Revenue', v: '₦0', c: 'text-ob-purple' }, { l: 'Commission Earned', v: '₦0', c: 'text-green-600' }, { l: 'Pending Settlements', v: '₦0', c: 'text-amber-600' }, { l: 'Refunds Issued', v: '₦0', c: 'text-red-600' }].map((s, i) => <div key={i} className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">{s.l}</p><p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-bold text-ob-navy mb-4">Transaction History</h3>
        <p className="text-gray-400 text-sm text-center py-12">Transaction data will appear here once payments are processed through Paystack.</p>
      </div>
    </DashboardLayout>
  );
}
