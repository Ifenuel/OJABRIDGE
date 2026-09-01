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
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '', city: user.city || '', state: user.state || '' });
  }, [user, isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) return <div className="min-h-screen bg-ob-light flex items-center justify-center"><div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" /></div>;

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    updateProfile(form);
    setMessage({ type: 'success', text: 'Profile updated successfully.' });
    setSaving(false);
  };

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and delivery details.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" /><p className="text-xs text-gray-400 mt-1">Email cannot be changed</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="+234..." /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Default Delivery Address</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" /></div>
            </div>
          </div>
        </div>
        {message.text && <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.text}</div>}
        <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </DashboardLayout>
  );
}
