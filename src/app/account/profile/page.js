'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function AccountProfilePage() {
  const { user, isAuthenticated, loading: authLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', phone: '', country: '', currency: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    // Fetch real profile from database
    if (user) {
      fetch('/api/users/profile')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.user) {
            setForm({
              name: data.user.name || '',
              phone: data.user.phone || '',
              country: data.user.country || '',
              currency: data.user.currency || '',
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoadingProfile(false));
    }
  }, [user, isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) return (
    <div className="min-h-screen bg-ob-light flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        // Update local auth state too
        updateProfile(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information.</p>
      </div>

      {loadingProfile ? (
        <div className="space-y-4 max-w-3xl">
          {[1,2,3].map(i => <div key={i} className="bg-white p-6 rounded-xl border border-gray-100"><div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mb-3" /><div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" /></div>)}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="+234..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select value={form.country} onChange={e => setForm({...form, country: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">South Africa</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-8 py-2.5 rounded-xl transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}
