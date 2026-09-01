'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    label: 'Home', full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: 'Nigeria', is_default: false,
  });

  useEffect(() => { loadAddresses(); }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/addresses');
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Address added successfully' });
        setShowForm(false);
        setForm({ label: 'Home', full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Nigeria', is_default: false });
        loadAddresses();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      loadAddresses();
    } catch (e) {}
  };

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">My Addresses</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your shipping addresses.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-ob-purple text-white text-sm px-5 py-2.5 rounded-xl hover:bg-ob-purple-dark transition-colors">
          {showForm ? 'Cancel' : '+ Add Address'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border border-gray-100 mb-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Label</label>
              <select value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option>Home</option><option>Office</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Recipient name" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Phone number" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Country *</label>
              <input type="text" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Address Line 1 *</label>
              <input type="text" required value={form.address_line1} onChange={e => setForm({...form, address_line1: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Street address" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">State</label>
              <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>
          <button type="submit" className="bg-ob-purple text-white px-6 py-2.5 rounded-xl text-sm hover:bg-ob-purple-dark">Save Address</button>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="bg-white p-6 rounded-xl border border-gray-100"><div className="h-6 bg-gray-100 rounded animate-pulse w-1/3" /></div>)}</div>
      ) : addresses.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 text-center">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-400 text-sm">No saved addresses yet.</p>
          <button onClick={() => setShowForm(true)} className="text-ob-purple text-sm font-semibold mt-2 hover:underline">Add your first address →</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className={`bg-white p-5 rounded-xl border ${addr.is_default ? 'border-ob-purple ring-2 ring-ob-purple/20' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs bg-ob-purple/10 text-ob-purple px-2 py-0.5 rounded-full font-medium">{addr.label}</span>
                  {addr.is_default && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-2">Default</span>}
                </div>
                <button onClick={() => handleDelete(addr.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
              <p className="text-sm font-medium text-ob-navy mt-2">{addr.full_name || 'Recipient'}</p>
              <p className="text-sm text-gray-600 mt-1">{addr.address_line1}</p>
              {addr.address_line2 && <p className="text-sm text-gray-600">{addr.address_line2}</p>}
              <p className="text-sm text-gray-600">{[addr.city, addr.state].filter(Boolean).join(', ')} {addr.postal_code || ''}</p>
              <p className="text-sm text-gray-500 mt-1">{addr.country}</p>
              {addr.phone && <p className="text-xs text-gray-400 mt-2">📞 {addr.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
