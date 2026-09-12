'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ActionMenu from '@/components/ActionMenu';
import KycDocumentViewer from '@/components/KycDocumentViewer';
import { exportData, filterByDateRange, formatDate } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewRetailer, setReviewRetailer] = useState(null);
  const [kycDetails, setKycDetails] = useState(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [additionalInfoText, setAdditionalInfoText] = useState('');
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [additionalInfoTargetId, setAdditionalInfoTargetId] = useState(null);

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
      if (data.success) {
        loadRetailers();
        if (reviewRetailer && reviewRetailer.id === vendorId) setReviewRetailer(null);
      }
    } catch (err) { console.error(err); }
  };

  const openKycReview = async (retailer) => {
    setReviewRetailer(retailer);
    setLoadingKyc(true);
    setKycDetails(null);
    try {
      const res = await fetch(`/api/vendors/kyc?vendorId=${retailer.id}`);
      const data = await res.json();
      if (data.success && data.kyc) {
        setKycDetails(data.kyc);
      }
    } catch (err) {
      console.error('Failed to load KYC details:', err);
    }
    setLoadingKyc(false);
  };

  const filteredRetailers = retailers.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'verified') return r.kyc_status === 'VERIFIED';
    if (filter === 'pending') return ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(r.kyc_status);
    if (filter === 'suspended') return r.kyc_status === 'SUSPENDED' || r.user_status === 'suspended';
    if (filter === 'failed') return r.kyc_status === 'VERIFICATION_FAILED' || r.kyc_status === 'BANNED';
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
      case 'SUSPENDED': case 'BANNED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleReject = (retailerId) => {
    setRejectTargetId(retailerId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRequestAdditionalInfo = (retailerId) => {
    setAdditionalInfoTargetId(retailerId);
    setAdditionalInfoText('');
    setShowAdditionalInfoModal(true);
  };

  const confirmRequestAdditionalInfo = () => {
    if (additionalInfoText.trim() && additionalInfoTargetId) {
      updateRetailer(additionalInfoTargetId, {
        kyc_status: 'REQUIRES_ADDITIONAL_INFO',
        additional_info_request: additionalInfoText.trim(),
      });
      setShowAdditionalInfoModal(false);
      setAdditionalInfoTargetId(null);
      setAdditionalInfoText('');
    }
  };

  const confirmReject = () => {
    if (rejectReason.trim() && rejectTargetId) {
      updateRetailer(rejectTargetId, { kyc_status: 'VERIFICATION_FAILED', kyc_rejection_reason: rejectReason.trim() });
      setShowRejectModal(false);
      setRejectTargetId(null);
      setRejectReason('');
    }
  };

  return (
    <DashboardLayout role="admin" requiredPermission="retailers">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Retailers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage retailer accounts, verification status and business information.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Retailers', value: retailers.length, color: 'text-ob-navy' },
          { label: 'Verified', value: retailers.filter(r => r.kyc_status === 'VERIFIED').length, color: 'text-green-600' },
          { label: 'Pending KYC', value: retailers.filter(r => ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED'].includes(r.kyc_status)).length, color: 'text-amber-600' },
          { label: 'Suspended', value: retailers.filter(r => r.kyc_status === 'SUSPENDED').length, color: 'text-red-600' },
          { label: 'Banned', value: retailers.filter(r => r.kyc_status === 'BANNED').length, color: 'text-red-800' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

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
            const exportRows = dateRange ? filterByDateRange(filteredRetailers, dateRange.start, dateRange.end, 'created_at') : filteredRetailers;
            exportData({
              format,
              title: 'Retailers Report',
              filename: 'ojabridge_retailers_report',
              dateRange,
              columns: [
                { key: 'store_name', label: 'Store Name' },
                { key: 'owner_name', label: 'Owner' },
                { key: 'owner_email', label: 'Email' },
                { key: 'owner_phone', label: 'Phone' },
                { key: 'business_name', label: 'Business' },
                { key: 'kyc_status', label: 'KYC Status' },
                { key: 'bank_verification_status', label: 'Bank Status' },
                { key: 'total_orders', label: 'Orders' },
                { key: 'created_at', label: 'Registered', format: (v) => formatDate(v) },
              ],
              rows: exportRows,
              summary: [
                { label: 'Total Retailers', value: retailers.length },
                { label: 'Exported', value: exportRows.length },
              ],
            });
          }}
        />
      </div>

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
                [...Array(5)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : filteredRetailers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                  {retailers.length === 0 ? 'No retailers registered yet.' : 'No retailers match your filter.'}
                </td></tr>
              ) : (
                filteredRetailers.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-ob-navy">{r.store_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-700">{r.owner_name || '—'}</div>
                      <div className="text-xs text-gray-400">{r.owner_email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-500">{r.business_name || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${kycBadge(r.kyc_status)}`}>{(r.kyc_status || 'NOT_STARTED').replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.bank_verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{(r.bank_verification_status || 'NOT_STARTED').replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.total_orders || 0}</td>
                    <td className="px-6 py-4">
                      <ActionMenu actions={[
                        { label: 'Review KYC', icon: '📋', onClick: () => openKycReview(r) },
                        { label: 'Approve', icon: '✅', hidden: r.kyc_status === 'VERIFIED' || r.kyc_status === 'SUSPENDED' || r.kyc_status === 'BANNED', className: 'text-green-700', onClick: () => updateRetailer(r.id, { kyc_status: 'VERIFIED' }) },
                        { label: 'Reject KYC', icon: '❌', hidden: !['SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(r.kyc_status), className: 'text-red-600', onClick: () => handleReject(r.id) },
                        { label: 'Request More Docs', icon: '📄', className: 'text-blue-600', hidden: r.kyc_status === 'VERIFIED' || r.kyc_status === 'BANNED' || r.kyc_status === 'NOT_STARTED', onClick: () => handleRequestAdditionalInfo(r.id) },
                        { label: 'Suspend', icon: '⚠️', hidden: r.kyc_status === 'SUSPENDED' || r.kyc_status === 'BANNED', className: 'text-amber-600', onClick: () => updateRetailer(r.id, { kyc_status: 'SUSPENDED', is_active: false }) },
                        { label: 'Ban', icon: '🚫', hidden: r.kyc_status === 'BANNED', className: 'text-red-700', confirm: 'Are you sure you want to BAN this retailer? This action is severe.', onClick: () => updateRetailer(r.id, { kyc_status: 'BANNED', is_active: false }) },
                        { label: 'Reinstate', icon: '♻️', hidden: !(r.kyc_status === 'SUSPENDED' || r.kyc_status === 'BANNED'), className: 'text-blue-600', onClick: () => updateRetailer(r.id, { kyc_status: 'NOT_STARTED', is_active: true }) },
                      ]} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Review Modal */}
      {reviewRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReviewRetailer(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-ob-navy text-lg">KYC Review — {reviewRetailer.store_name}</h3>
                <p className="text-xs text-gray-400">{reviewRetailer.owner_name} • {reviewRetailer.owner_email}</p>
              </div>
              <button onClick={() => setReviewRetailer(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {loadingKyc ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 text-sm mt-3">Loading KYC details...</p>
                </div>
              ) : kycDetails ? (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${reviewRetailer.kyc_status === 'VERIFIED' ? 'bg-green-50 border border-green-200' : reviewRetailer.kyc_status === 'BANNED' ? 'bg-red-100 border border-red-300' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className={`text-sm font-semibold ${reviewRetailer.kyc_status === 'VERIFIED' ? 'text-green-700' : reviewRetailer.kyc_status === 'BANNED' ? 'text-red-700' : 'text-amber-700'}`}>
                      Status: {(reviewRetailer.kyc_status || 'NOT_STARTED').replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3">👤 Personal Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Full Name</p><p className="text-sm font-medium text-gray-700">{kycDetails.fullName || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Date of Birth</p><p className="text-sm font-medium text-gray-700">{kycDetails.dateOfBirth || '—'}</p></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3">🪪 Identity Verification</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">BVN</p><p className="text-sm font-medium text-gray-700">{kycDetails.bvn || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">NIN</p><p className="text-sm font-medium text-gray-700">{kycDetails.nin || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">ID Type</p><p className="text-sm font-medium text-gray-700">{kycDetails.idType || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">ID Number</p><p className="text-sm font-medium text-gray-700">{kycDetails.idNumber || '—'}</p></div>
                    </div>
                    {kycDetails.idDocumentUrl && (
                      <KycDocumentViewer url={kycDetails.idDocumentUrl} label="Uploaded ID Document" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3">🏦 Bank Account</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Bank</p><p className="text-sm font-medium text-gray-700">{kycDetails.bankName || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Account No</p><p className="text-sm font-medium text-gray-700">{kycDetails.bankAccountNumber || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Account Name</p><p className="text-sm font-medium text-gray-700">{kycDetails.bankAccountName || '—'}</p></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm mb-3">🏢 Business Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Business Name</p><p className="text-sm font-medium text-gray-700">{kycDetails.businessName || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">RC Number</p><p className="text-sm font-medium text-gray-700">{kycDetails.rcNumber || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Type</p><p className="text-sm font-medium text-gray-700">{kycDetails.businessType || '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] text-gray-400 uppercase">Address</p><p className="text-sm font-medium text-gray-700">{kycDetails.businessAddress || '—'}</p></div>
                    </div>
                  </div>

                  {reviewRetailer.kyc_rejection_reason && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                      <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-600">{reviewRetailer.kyc_rejection_reason}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                    {reviewRetailer.kyc_status !== 'VERIFIED' && reviewRetailer.kyc_status !== 'BANNED' && (
                      <button onClick={() => updateRetailer(reviewRetailer.id, { kyc_status: 'VERIFIED' })} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">✓ Approve</button>
                    )}
                    {['SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(reviewRetailer.kyc_status) && (
                      <button onClick={() => { setRejectTargetId(reviewRetailer.id); setShowRejectModal(true); }} className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">✗ Reject</button>
                    )}
                    {['SUBMITTED', 'VERIFYING', 'MANUAL_REVIEW'].includes(reviewRetailer.kyc_status) && (
                      <button onClick={() => handleRequestAdditionalInfo(reviewRetailer.id)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">📄 Request More Docs</button>
                    )}
                    {reviewRetailer.kyc_status !== 'SUSPENDED' && reviewRetailer.kyc_status !== 'BANNED' && (
                      <button onClick={() => updateRetailer(reviewRetailer.id, { kyc_status: 'SUSPENDED', is_active: false })} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">⚠ Suspend</button>
                    )}
                    {reviewRetailer.kyc_status !== 'BANNED' && (
                      <button onClick={() => { if (confirm('BAN this retailer?')) updateRetailer(reviewRetailer.id, { kyc_status: 'BANNED', is_active: false }); }} className="bg-red-700 hover:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">🚫 Ban</button>
                    )}
                    {(reviewRetailer.kyc_status === 'SUSPENDED' || reviewRetailer.kyc_status === 'BANNED') && (
                      <button onClick={() => updateRetailer(reviewRetailer.id, { kyc_status: 'NOT_STARTED', is_active: true })} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">Reinstate</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">No KYC data available.</div>
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
            <p className="text-sm text-gray-500 mb-4">This reason will be visible to the retailer.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="Enter the reason for rejection..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={confirmReject} disabled={!rejectReason.trim()} className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-50">Reject</button>
              <button onClick={() => setShowRejectModal(false)} className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info Request Modal */}
      {showAdditionalInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdditionalInfoModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-ob-navy mb-2">📄 Request More Documents</h3>
            <p className="text-sm text-gray-500 mb-4">Tell the retailer what additional information or documents are needed. This will be sent via email and in-app notification.</p>
            <textarea value={additionalInfoText} onChange={e => setAdditionalInfoText(e.target.value)} rows={4}
              placeholder="e.g. Please provide a valid proof of address (utility bill or bank statement dated within the last 3 months)."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={confirmRequestAdditionalInfo} disabled={!additionalInfoText.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-50">Send Request</button>
              <button onClick={() => setShowAdditionalInfoModal(false)} className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
