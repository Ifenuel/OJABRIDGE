'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminSecurityPage() {
  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Security Center</h1><p className="text-gray-500 text-sm mt-1">Monitor security events, fraud detection and account enforcement.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ l: 'Security Events (24h)', v: 0, c: 'text-ob-navy' }, { l: 'Failed Logins', v: 0, c: 'text-red-600' }, { l: 'Suspicious Activity', v: 0, c: 'text-amber-600' }, { l: 'Accounts Restricted', v: 0, c: 'text-orange-600' }].map((s, i) => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs text-gray-500">{s.l}</p><p className={`text-xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Recent Security Events</h3>
          <p className="text-gray-400 text-sm text-center py-8">Security events will appear here once the platform is active.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">System Health</h3>
          <div className="space-y-3">
            {['Authentication Service', 'Payment Gateway', 'Database', 'Email Service'].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{s}</span>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-green-600">Operational</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
