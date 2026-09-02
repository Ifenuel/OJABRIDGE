'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function RetailerProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/users/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setName(data.user.name || '');
          setPhone(data.user.phone || '');
          setCountry(data.user.country || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, country }),
      });
      const data = await res.json();
      if (data.success) {
        updateProfile(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information.</p>
      </div>

      {loadingProfile ? (
        <div className="space-y-4 max-w-lg">
          {[1,2,3].map(i => <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100"><div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mb-3" /><div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" /></div>)}
        </div>
      ) : (
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="+234..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple outline-none text-sm">
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
                <option value="KE">Kenya</option>
                <option value="ZA">South Africa</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
