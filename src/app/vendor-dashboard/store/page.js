'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function VendorStorePage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    storeName: '', storeDescription: '', businessPhone: '', businessEmail: '', productCategories: [],
  });

  const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Health', 'Accessories', 'Groceries', 'Sports', 'Automotive'];

  useEffect(() => {
    async function loadVendor() {
      try {
        const res = await fetch('/api/vendors?limit=100');
        const data = await res.json();
        const myVendor = data.vendors?.find(v => v.user_id === user?.id);
        if (myVendor) {
          setForm({
            storeName: myVendor.store_name || '',
            storeDescription: myVendor.store_description || '',
            businessPhone: myVendor.business_phone || '',
            businessEmail: myVendor.business_email || '',
            productCategories: myVendor.product_categories || [],
          });
        }
      } catch (e) {}
      setLoading(false);
    }
    if (user) loadVendor();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/vendors/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: form.storeName,
          store_description: form.storeDescription,
          business_phone: form.businessPhone,
          business_email: form.businessEmail,
          product_categories: form.productCategories,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Store settings saved successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const toggleCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(cat)
        ? prev.productCategories.filter(c => c !== cat)
        : [...prev.productCategories, cat],
    }));
  };

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Store Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store profile, branding and configuration.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white p-6 rounded-xl border border-gray-100"><div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mb-3" /><div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" /></div>)}</div>
      ) : (
        <div className="max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">
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

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-4">Contact Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                  <input type="tel" value={form.businessPhone} onChange={e => setForm({...form, businessPhone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="+234..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                  <input type="email" value={form.businessEmail} onChange={e => setForm({...form, businessEmail: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="business@example.com" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-4">Product Categories</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.productCategories.includes(cat) ? 'bg-ob-purple text-white border-ob-purple' : 'bg-white text-gray-600 border-gray-200 hover:border-ob-purple'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-4">Store URL</h3>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-gray-400 text-sm">ojabridge.com/vendor/</span>
                <span className="text-sm font-medium text-ob-navy">{user?.storeSlug || 'your-store'}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-4">Bank Account (for Payouts)</h3>
              <div className="bg-ob-light rounded-lg p-4 text-sm text-gray-600">
                <p>Bank account details are managed through the KYC & Verification section for security purposes.</p>
                <a href="/vendor-dashboard/kyc" className="text-ob-purple font-medium mt-2 inline-block hover:underline">Manage Bank Account →</a>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.text}</div>
            )}

            <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
