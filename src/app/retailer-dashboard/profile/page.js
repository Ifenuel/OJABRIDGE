'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function RetailerProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm" />
          </div>
          <button onClick={handleSave} className="btn-primary">
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
