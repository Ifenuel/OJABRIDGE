'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDisputesPage() {
  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Disputes</h1><p className="text-gray-500 text-sm mt-1">Review and resolve customer-vendor disputes.</p></div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ l: 'Open', v: 0, c: 'text-red-600' }, { l: 'Under Review', v: 0, c: 'text-amber-600' }, { l: 'Resolved', v: 0, c: 'text-green-600' }].map((s, i) => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs text-gray-500">{s.l}</p><p className={`text-xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="text-gray-400 text-sm text-center py-12">Disputes will appear here when customers or vendors open dispute cases.</p>
      </div>
    </DashboardLayout>
  );
}
