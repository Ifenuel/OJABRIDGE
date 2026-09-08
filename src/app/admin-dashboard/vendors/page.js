'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exportData, filterByDateRange, formatDate } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';
import ActionMenu from '@/components/ActionMenu';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewVendor, setReviewVendor] = useState(null);
  const [kycDetails, setKycDetails] = useState(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);

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
      if (data.success) {
        loadVendors();
        if (reviewVendor && reviewVendor.id === vendorId) setReviewVendor(null);
      }
    } catch (err) { console.error(err); }
  };

  const openKycReview = async (vendor) => {
    setReviewVendor(vendor);
    setLoadingKyc(true);
    setKycDetails(null);
    try {
      const res = await fetch(`/api/vendors/kyc?vendorId=${vendor.id}`);
      const data = await res.json();
      if (data.success && data.kyc) {
        setKycDetails(data.kyc);
      }
    } catch (err) {
      console.error('Failed to load KYC details:', err);
    }
    setLoadingKyc(false);
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
      case 'BANNED': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleReject = (vendorId) => {
    setRejectTargetId(vendorId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (rejectReason.trim() && rejectTargetId) {
      updateVendor(rejectTargetId, { kyc_status: 'VERIFICATION_FAILED', kyc_rejection_reason: rejectReason.trim() });
      setShowRejectModal(false);
      setRejectTargetId(null);
      setRejectReason('');
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
        <ExportButton
          dateRangeOptions={dateRangeOptions}
          onExport={({ format, dateRange }) => {
            const exportRows = dateRange ? filterByDateRange(filteredVendors, dateRange.start, dateRange.end, 'created_at') : filteredVendors;
            exportData({
              format,
              title: 'Vendors Report',
              filename: 'ojabridge_vendors_report',
              dateRange,
              columns: [
                { key: 'store_name', label: 'Store Name' },
                { key: 'owner_name', label: 'Owner' },
                { key: 'owner_email', label: 'Email' },
                { key: 'owner_phone', label: 'Phone' },
                { key: 'business_name', label: 'Business' },
                { key: 'kyc_status', label: 'KYC Status' },
                { key: 'bank_verification_status', label: 'Bank Status' },
                { key: 'average_rating', label: 'Rating' },
                { key: 'total_orders', label: 'Orders' },
                { key: 'created_at', label: 'Registered', format: (v) => formatDate(v) },
              ],
              rows: exportRows,
              summary: [
                { label: 'Total Vendors', value: vendors.length },
                { label: 'Exported', value: exportRows.length },
              ],
            });
          }}
        />
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
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-700">{v.owner_name || '—'}</div>
                      <div className="text-xs text-gray-400">{v.owner_email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-500">{v.business_name || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${kycBadge(v.kyc_status)}`}>{(v.kyc_status || 'NOT_STARTED').replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v.bank_verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{(v.bank_verification_status || 'NOT_STARTED').replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.average_rating ? `⭐ ${Number(v.average_rating).toFixed(1)}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.total_orders || 0}</td>
                    <td className="px-6 py-4">
                      <ActionMenu
                        label="Actions ▾"
                        actions={[
                          { label: 'Review KYC', icon: '📋', onClick: () => openKycReview(v) },
                          { label: 'Approve', icon: '✅', className: 'text-green-700', hidden: v.kyc_status === 'VERIFIED' || v.kyc_status === 'SUSPENDED' || v.kyc_status === 'BANNED', onClick: () => updateVendor(v.id, { kyc_status: 'VERIFIED' }) },
                          { label: 'Reject KYC', icon: '❌', className: 'text-red-600', hidden: !['SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(v.kyc_status), onClick: () => handleReject(v.id) },
                          { label: 'Suspend', icon: '⚠️', className: 'text-amber-600', hidden: v.kyc_status === 'SUSPENDED' || v.kyc_status === 'BANNED', onClick: () => updateVendor(v.id, { kyc_status: 'SUSPENDED', is_active: false }) },
                          { label: 'Ban', icon: '🚫', className: 'text-red-700', hidden: v.kyc_status === 'BANNED', confirm: 'Are you sure you want to BAN this vendor? This action is severe.', onClick: () => updateVendor(v.id, { kyc_status: 'BANNED', is_active: false }) },
                          { label: 'Reinstate', icon: '♻️', className: 'text-blue-600', hidden: v.kyc_status !== 'SUSPENDED' && v.kyc_status !== 'BANNED', onClick: () => updateVendor(v.id, { kyc_status: 'NOT_STARTED', is_active: true }) },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Review Modal */}
      {reviewVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReviewVendor(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-ob-navy text-lg">KYC Review — {reviewVendor.store_name}</h3>
                <p className="text-xs text-gray-400">{reviewVendor.owner_name} • {reviewVendor.owner_email}</p>
              </div>
              <button onClick={() => setReviewVendor(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingKyc ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 text-sm mt-3">Loading KYC details...</p>
                </div>
              ) : kycDetails ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl ${reviewVendor.kyc_status === 'VERIFIED' ? 'bg-green-50 border border-green-200' : reviewVendor.kyc_status === 'SUBMITTED' || reviewVendor.kyc_status === 'VERIFYING' ? 'bg-amber-50 border border-amber-200' : reviewVendor.kyc_status === 'BANNED' ? 'bg-red-100 border border-red-300' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className={`text-sm font-semibold ${(reviewVendor.kyc_status === 'VERIFIED') ? 'text-green-700' : reviewVendor.kyc_status === 'BANNED' ? 'text-red-700' : 'text-amber-700'}`}>
                      Status: {(reviewVendor.kyc_status || 'NOT_STARTED').replace(/_/g, ' ')}
                    </p>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3 flex items-center gap-2">👤 Personal Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Full Name</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.fullName || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.dateOfBirth || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Identity Verification */}
                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3 flex items-center gap-2">🪪 Identity Verification</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">BVN</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.bvn || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">NIN</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.nin || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">ID Type</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.idType || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">ID Number</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.idNumber || '—'}</p>
                      </div>
                    </div>
                    {kycDetails.idDocumentUrl && (
                      <div className="mt-3">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Uploaded ID Document</p>
                        <a href={kycDetails.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-ob-purple text-sm hover:underline">
                          View Document →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Bank Account */}
                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3 flex items-center gap-2">🏦 Bank Account</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Bank Name</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.bankName || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Account Number</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.bankAccountNumber || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Account Name</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.bankAccountName || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3 flex items-center gap-2">🏢 Business Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Business Name</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.businessName || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">RC Number</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.rcNumber || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Business Type</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.businessType || '—'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[10px] text-gray-400 uppercase">Business Address</p>
                        <p className="text-sm font-medium text-gray-700">{kycDetails.businessAddress || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason if exists */}
                  {reviewVendor.kyc_rejection_reason && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                      <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-600">{reviewVendor.kyc_rejection_reason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                    {reviewVendor.kyc_status !== 'VERIFIED' && reviewVendor.kyc_status !== 'BANNED' && (
                      <button onClick={() => updateVendor(reviewVendor.id, { kyc_status: 'VERIFIED' })}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                        ✓ Approve Vendor
                      </button>
                    )}
                    {['SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(reviewVendor.kyc_status) && (
                      <button onClick={() => { setRejectTargetId(reviewVendor.id); setShowRejectModal(true); }}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                        ✗ Reject
                      </button>
                    )}
                    {reviewVendor.kyc_status !== 'SUSPENDED' && reviewVendor.kyc_status !== 'BANNED' && (
                      <button onClick={() => updateVendor(reviewVendor.id, { kyc_status: 'SUSPENDED', is_active: false })}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                        ⚠ Suspend
                      </button>
                    )}
                    {reviewVendor.kyc_status !== 'BANNED' && (
                      <button onClick={() => {
                        if (confirm('Are you sure you want to BAN this vendor?')) {
                          updateVendor(reviewVendor.id, { kyc_status: 'BANNED', is_active: false });
                        }
                      }}
                        className="bg-red-700 hover:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                        🚫 Ban Vendor
                      </button>
                    )}
                    {(reviewVendor.kyc_status === 'SUSPENDED' || reviewVendor.kyc_status === 'BANNED') && (
                      <button onClick={() => updateVendor(reviewVendor.id, { kyc_status: 'NOT_STARTED', is_active: true })}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                        Reinstate Vendor
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No KYC data available for this vendor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-ob-navy mb-2">Rejection Reason</h3>
            <p className="text-sm text-gray-500 mb-4">This reason will be visible to the vendor.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter the reason for rejection..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={confirmReject} disabled={!rejectReason.trim()}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
                Reject Vendor
              </button>
              <button onClick={() => setShowRejectModal(false)}
                className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
