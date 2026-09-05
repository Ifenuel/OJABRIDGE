'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      const res = await fetch('/api/vendors?limit=100');
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (err) { console.error('Failed to load vendors:', err); }
    setLoading(false);
  };

  const updateVendor = async (vendorId, updates) => {
    try {
      const res = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, ...updates }),
      });
      const data = await res.json();
      if (data.success) loadVendors();
    } catch (err) { console.error(err); }
  };

  const filteredVendors = vendors.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'verified') return v.kyc_status === 'VERIFIED';
    if (filter === 'pending') return ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(v.kyc_status);
    if (filter === 'suspended') return v.kyc_status === 'SUSPENDED' || v.user_status === 'suspended';
    if (filter === 'failed') return v.kyc_status === 'VERIFICATION_FAILED';
    return true;
  }).filter(v => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (v.store_name || '').toLowerCase().includes(q) || (v.owner_name || '').toLowerCase().includes(q) || (v.owner_email || '').toLowerCase().includes(q) || (v.business_name || '').toLowerCase().includes(q);
  });

  const kycBadge = (status) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': case 'SUBMITTED': case 'VERIFYING': return 'bg-blue-100 text-blue-700';
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-600';
      case 'VERIFICATION_FAILED': case 'REQUIRES_ADDITIONAL_INFO': return 'bg-red-100 text-red-700';
      case 'MANUAL_REVIEW': return 'bg-amber-100 text-amber-700';
      case 'SUSPENDED': case 'REVOKED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Vendors</h1>
        <p className="text-gray-500 text-sm mt-1">Manage vendor applications, verification and account status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Vendors', value: vendors.length, color: 'text-ob-navy' },
          { label: 'Verified', value: vendors.filter(v => v.kyc_status === 'VERIFIED').length, color: 'text-green-600' },
          { label: 'Pending KYC', value: vendors.filter(v => ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING'].includes(v.kyc_status)).length, color: 'text-amber-600' },
          { label: 'Failed/Suspended', value: vendors.filter(v => ['VERIFICATION_FAILED', 'SUSPENDED', 'REVOKED'].includes(v.kyc_status)).length, color: 'text-red-600' },
          { label: 'Bank Verified', value: vendors.filter(v => v.bank_verification_status === 'VERIFIED').length, color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'verified', 'pending', 'suspended', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple/30'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by store, name or email..."
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none flex-1 max-w-sm" />
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Store</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Business</th>
                <th className="px-6 py-4 font-medium">KYC</th>
                <th className="px-6 py-4 font-medium">Bank</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={8} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : filteredVendors.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                  {vendors.length === 0 ? 'No vendors registered yet.' : 'No vendors match your filter.'}
                </td></tr>
              ) : (
                filteredVendors.map(v => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-ob-navy">{v.store_name}</div>
                      <div className="text-xs text-gray-400">/{v.store_slug}</div>
                      {v.store_description && <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{v.store_description}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-700">{v.owner_name || '—'}</div>
                      <div className="text-xs text-gray-400">{v.owner_email || '—'}</div>
                      {v.owner_phone && <div className="text-xs text-gray-400">{v.owner_phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-500">{v.business_name || '—'}</div>
                      {v.product_categories?.length > 0 && <div className="text-xs text-gray-400 mt-1">{v.product_categories.slice(0, 2).join(', ')}{v.product_categories.length > 2 ? '...' : ''}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${kycBadge(v.kyc_status)}`}>{(v.kyc_status || 'NOT_STARTED').replace(/_/g, ' ')}</span>
                      {v.kyc_rejection_reason && <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={v.kyc_rejection_reason}>Reason: {v.kyc_rejection_reason}</p>}
                    </td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v.bank_verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{(v.bank_verification_status || 'NOT_STARTED').replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.average_rating ? `⭐ ${Number(v.average_rating).toFixed(1)}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.total_orders || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {v.kyc_status !== 'VERIFIED' && [
                          'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'
                        ].includes(v.kyc_status) && (
                          <button onClick={() => updateVendor(v.id, { kyc_status: 'VERIFIED' })} className="text-green-600 text-xs font-medium hover:underline">Approve</button>
                        )}
                        {v.kyc_status !== 'VERIFIED' && v.kyc_status !== 'SUSPENDED' && v.kyc_status !== 'VERIFICATION_FAILED' && [
                          'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'
                        ].includes(v.kyc_status) && (
                          <button onClick={() => {
                            const reason = prompt('Rejection reason (visible to vendor):');
                            if (reason) updateVendor(v.id, { kyc_status: 'VERIFICATION_FAILED', kyc_rejection_reason: reason });
                          }} className="text-red-500 text-xs font-medium hover:underline">Reject</button>
                        )}
                        {v.kyc_status !== 'SUSPENDED' && (
                          <button onClick={() => updateVendor(v.id, { kyc_status: 'SUSPENDED', is_active: false })} className="text-amber-600 text-xs font-medium hover:underline">Suspend</button>
                        )}
                        {v.kyc_status === 'SUSPENDED' && (
                          <button onClick={() => updateVendor(v.id, { kyc_status: 'NOT_STARTED', is_active: true })} className="text-blue-600 text-xs font-medium hover:underline">Reinstate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
