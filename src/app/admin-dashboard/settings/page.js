'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminSettingsPage() {
  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Settings</h1><p className="text-gray-500 text-sm mt-1">Platform configuration, commission rates and system settings.</p></div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Platform Settings</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label><input type="text" defaultValue="OjaBridge" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label><input type="number" defaultValue="10" min="0" max="50" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Supported Currencies</label><input type="text" defaultValue="NGN, USD, EUR, GBP" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₦)</label><input type="number" defaultValue="50000" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <button className="btn-primary px-6 py-2.5 mt-6">Save Settings</button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Admin Accounts</h3>
          <p className="text-gray-500 text-sm">Manage administrator accounts and roles. Only the Super Admin can create or modify admin accounts.</p>
          <div className="mt-4 p-4 bg-ob-light rounded-lg text-sm text-gray-600">
            <p>Admin role management will be available once the database is connected and the Super Admin account is configured.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
