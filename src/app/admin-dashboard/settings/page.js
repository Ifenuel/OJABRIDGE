'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AvatarUpload from '@/components/AvatarUpload';
import { useAuth } from '@/context/AuthContext';



export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [platformSettings, setPlatformSettings] = useState({ platform_commission: 10, free_shipping_threshold: 50000 });
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setPlatformSettings(data.settings);
      }
    } catch {}
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: platformSettings }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Platform settings saved. Changes take effect immediately.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error saving settings' });
    }
    setSettingsSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };



  return (
    <DashboardLayout role="admin" requiredPermission="settings">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Platform Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage admin roles, permissions and platform configuration.</p>
      </div>

      {/* Profile Picture */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 mb-6 max-w-3xl">
        <h3 className="font-bold text-ob-navy mb-4">Profile Picture</h3>
        <AvatarUpload currentUrl={user?.avatar_url || null} name={user?.name} onSaved={() => {}} />
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}





      {/* Platform Configuration */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Commission Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Platform Commission (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={platformSettings.platform_commission}
                  onChange={e => setPlatformSettings({ ...platformSettings, platform_commission: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-ob-navy focus:border-ob-purple outline-none"
                />
                <span className="text-sm text-gray-500">% per transaction</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Deducted from each successful payment before vendor settlement.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Free Shipping Threshold (₦)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">₦</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={platformSettings.free_shipping_threshold}
                  onChange={e => setPlatformSettings({ ...platformSettings, free_shipping_threshold: parseInt(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-ob-navy focus:border-ob-purple outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping.</p>
            </div>
            <button
              onClick={saveSettings}
              disabled={settingsSaving}
              className="bg-ob-purple text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-ob-purple-dark disabled:opacity-50 transition-colors"
            >
              {settingsSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-ob-navy mb-4">Platform Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Platform</span>
              <span className="text-sm font-medium text-ob-navy">OjaBridge</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Payment Gateway</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Paystack</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Supported Currencies</span>
              <span className="text-xs text-gray-500">NGN</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Escrow System</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
            </div>
          </div>
        </div>
      </div>


    </DashboardLayout>
  );
}
