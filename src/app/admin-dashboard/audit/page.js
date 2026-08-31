'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminAuditPage() {
  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Audit Logs</h1><p className="text-gray-500 text-sm mt-1">Complete activity log of all platform actions for compliance and investigation.</p></div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search logs..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
        <select className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm"><option>All Actions</option><option>Authentication</option><option>Orders</option><option>Payments</option><option>Security</option><option>Admin</option></select>
        <input type="date" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="px-6 py-4 font-medium">Timestamp</th><th className="px-6 py-4 font-medium">Action</th><th className="px-6 py-4 font-medium">User</th><th className="px-6 py-4 font-medium">Entity</th><th className="px-6 py-4 font-medium">IP Address</th></tr></thead>
            <tbody>
              <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">Audit logs will appear here once platform activity begins. Every login, order, payment, and admin action will be recorded.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
