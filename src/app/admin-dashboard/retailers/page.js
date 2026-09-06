'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exportCsv, formatDate } from '@/lib/csvExport';

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadRetailers(); }, []);

  const loadRetailers = async () => {
    try {
      const res = await fetch('/api/vendors?role=retailer&limit=100');
      const data = await res.json();
      setRetailers(data.vendors || []);
    } catch (err) { console.error('Failed to load retailers:', err); }
    setLoading(false);
  };

  const updateRetailer = async (vendorId, updates) => {
    try {
      const res = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, ...updates }),
      });
      const data = await res.json();
      if (data.success) loadRetailers();
    } catch (err) { console.error(err); }
  };

  const filteredRetailers = retailers.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'verified') return r.kyc_status === 'VERIFIED';
    if (filter === 'pending') return ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(r.kyc_status);
    if (filter === 'suspended') return r.kyc_status === 'SUSPENDED' || r.user_status === 'suspended';
    return true;
  }).filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (r.store_name || '').toLowerCase().includes(q) || (r.owner_name || '').toLowerCase().includes(q) || (r.owner_email || '').toLowerCase().includes(q);
  });

  const kycBadge = (status) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': case 'SUBMITTED': case 'VERIFYING': return 'bg-blue-100 text-blue-700';
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-600';
      case 'VERIFICATION_FAILED': return 'bg-red-100 text-red-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleExport = () => {
    exportCsv({
      title: 'Retailers Report',
      columns: [
        { key: 'store_name', label: 'Store Name' },
        { key: 'owner_name', label: 'Owner Name' },
        { key: 'owner_email', label: 'Email' },
        { key: 'owner_phone', label: 'Phone' },
        { key: 'business_name', label: 'Business Name' },
        { key: 'kyc_status', label: 'KYC Status' },
        { key: 'bank_verification_status', label: 'Bank Status' },
        { key: 'total_orders', label: 'Total Orders' },
        { key: 'created_at', label: 'Registered', format: (v) => formatDate(v) },
      ],
      rows: filteredRetailers,
      filename: 'ojabridge_retailers_report',
      summary: [
        { label: 'Total Retailers', value: retailers.length },
        { label: 'Verified', value: retailers.filter(r => r.kyc_status === 'VERIFIED').length },
        { label: 'Pending Verification', value: retailers.filter(r => ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED'].includes(r.kyc_status)).length },
      ],
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Retailers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage retailer accounts, verification status and business information.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Retailers', value: retailers.length, color: 'text-ob-navy' },
          { label: 'Verified', value: retailers.filter(r => r.kyc_status === 'VERIFIED').length, color: 'text-green-600' },
          { label: 'Pending KYC', value: retailers.filter(r => ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED'].includes(r.kyc_status)).length, color: 'text-amber-600' },
          { label: 'Suspended', value: retailers.filter(r => r.kyc_status === 'SUSPENDED').length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search + CSV */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'verified', 'pending', 'suspended'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple/30'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by store, name or email..."
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none flex-1 max-w-sm" />
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-ob-lime/10 text-ob-lime-dark rounded-lg text-sm font-medium hover:bg-ob-lime/20 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV ({filteredRetailers.length})
        </button>
      </div>

      {/* Retailers Table */}
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
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : filteredRetailers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                  {retailers.length === 0 ? 'No retailers registered yet.' : 'No retailers match your filter.'}
                </td></tr>
              ) : (
                filteredRetailers.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-ob-navy">{r.store_name}</div>
                      <div className="text-xs text-gray-400">/{r.store_slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-700">{r.owner_name || '—'}</div>
                      <div className="text-xs text-gray-400">{r.owner_email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{r.business_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${kycBadge(r.kyc_status)}`}>
                        {(r.kyc_status || 'NOT_STARTED').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.bank_verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {(r.bank_verification_status || 'NOT_STARTED').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.total_orders || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {r.kyc_status !== 'VERIFIED' && ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(r.kyc_status) && (
                          <button onClick={() => updateRetailer(r.id, { kyc_status: 'VERIFIED' })} className="text-green-600 text-xs font-medium hover:underline">Approve</button>
                        )}
                        {r.kyc_status !== 'SUSPENDED' && (
                          <button onClick={() => updateRetailer(r.id, { kyc_status: 'SUSPENDED', is_active: false })} className="text-amber-600 text-xs font-medium hover:underline">Suspend</button>
                        )}
                        {r.kyc_status === 'SUSPENDED' && (
                          <button onClick={() => updateRetailer(r.id, { kyc_status: 'NOT_STARTED', is_active: true })} className="text-blue-600 text-xs font-medium hover:underline">Reinstate</button>
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
