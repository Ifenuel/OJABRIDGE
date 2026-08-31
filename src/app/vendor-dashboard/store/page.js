'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function VendorStorePage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    storeName: user?.storeName || '',
    storeDescription: user?.storeDescription || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Update store locally
    updateProfile(form);
    setMessage({ type: 'success', text: 'Store settings saved successfully.' });
    setSaving(false);
  };

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Store Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store profile, branding and configuration.</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Store Profile */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Store Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                <input type="text" required value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea rows={3} value={form.storeDescription} onChange={e => setForm({...form, storeDescription: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm resize-none" placeholder="Tell customers about your store..." />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Contact Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
              </div>
            </div>
          </div>

          {/* Bank Account */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Bank Account (for Payouts)</h3>
            <div className="bg-ob-light rounded-lg p-4 text-sm text-gray-600">
              <p>Bank account details are managed through the KYC & Verification section for security purposes.</p>
              <a href="/vendor-dashboard/kyc" className="text-ob-purple font-medium mt-2 inline-block hover:underline">Manage Bank Account →</a>
            </div>
          </div>

          {/* Store URL */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Store URL</h3>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="text-gray-400 text-sm">ojabridge.com/vendor/</span>
              <span className="text-sm font-medium text-ob-navy">{user?.storeSlug || 'your-store'}</span>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
