'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exportData, filterByDateRange, formatDate } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [resolving, setResolving] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => { loadDisputes(); }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/disputes?limit=100');
      const d = await res.json();
      setDisputes(d.disputes || []);
    } catch (e) {}
    setLoading(false);
  };

  const resolveDispute = async (disputeId, status) => {
    setResolving(disputeId);
    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, status, resolution: resolutionNote }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Dispute ${status.replace(/_/g, ' ')} successfully` });
        setResolutionNote('');
        loadDisputes();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setResolving(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const filtered = filter === 'all' ? disputes : disputes.filter(d => d.status === filter);
  const openCount = disputes.filter(d => ['open', 'under_review', 'vendor_response_required', 'escalated'].includes(d.status)).length;
  const resolvedCount = disputes.filter(d => ['resolved_favor_buyer', 'resolved_favor_vendor', 'closed'].includes(d.status)).length;

  const statusColor = (s) => ({
    open: 'bg-red-100 text-red-700', under_review: 'bg-amber-100 text-amber-700',
    vendor_response_required: 'bg-blue-100 text-blue-700', escalated: 'bg-red-200 text-red-800',
    resolved_favor_buyer: 'bg-green-100 text-green-700', resolved_favor_vendor: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Disputes</h1>
        <p className="text-gray-500 text-sm mt-1">Review and resolve customer-vendor disputes.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { l: 'Open', value: openCount, c: 'text-red-600', icon: '🔴' },
          { l: 'Under Review', value: disputes.filter(d => d.status === 'under_review').length, c: 'text-amber-600', icon: '🟡' },
          { l: 'Resolved', value: resolvedCount, c: 'text-green-600', icon: '🟢' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.l}</p>
              <span>{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'open', 'under_review', 'vendor_response_required', 'escalated', 'resolved_favor_buyer', 'resolved_favor_vendor', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">Disputes ({filtered.length})</h3>
          <ExportButton
            dateRangeOptions={dateRangeOptions}
            onExport={({ format, dateRange }) => {
              const exportRows = dateRange ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'created_at') : filtered;
              exportData({
                format,
                title: 'Disputes Report',
                filename: 'ojabridge_disputes',
                dateRange,
                summary: [
                  { label: 'Total Disputes', value: disputes.length },
                  { label: 'Exported', value: exportRows.length },
                ],
                columns: [
                  { key: 'id', label: 'Dispute ID' },
                  { key: 'order_id', label: 'Order ID' },
                  { key: 'reporter', label: 'Reported By' },
                  { key: 'reason', label: 'Reason' },
                  { key: 'description', label: 'Description' },
                  { key: 'status', label: 'Status', format: (v) => (v || '').replace(/_/g, ' ') },
                  { key: 'resolution', label: 'Resolution' },
                  { key: 'created_at', label: 'Date Filed', format: (v) => formatDate(v) },
                  { key: 'resolved_at', label: 'Date Resolved', format: (v) => v ? formatDate(v) : 'Pending' },
                ],
                rows: exportRows.map(d => ({
                  id: d.id?.slice(0, 8),
                  order_id: d.order_id?.slice(0, 8) || '—',
                  reporter: d.reporter_name || d.user_name || '—',
                  reason: d.reason,
                  description: d.description,
                  status: d.status,
                  resolution: d.resolution || '—',
                  created_at: d.created_at,
                  resolved_at: d.resolved_at,
                })),
              });
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No disputes found.</td></tr>
              ) : filtered.map(d => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-ob-navy">{d.order_id?.slice(0, 8) || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{d.description}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(d.status)}`}>
                      {d.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {['open', 'under_review', 'vendor_response_required', 'escalated'].includes(d.status) ? (
                      <div className="flex items-center gap-1">
                        {resolving === d.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={resolutionNote}
                              onChange={e => setResolutionNote(e.target.value)}
                              placeholder="Resolution note..."
                              className="text-xs px-2 py-1 border border-gray-200 rounded w-32"
                            />
                            <button onClick={() => resolveDispute(d.id, 'resolved_favor_buyer')} className="text-green-600 text-xs font-medium hover:underline">Buyer</button>
                            <button onClick={() => resolveDispute(d.id, 'resolved_favor_vendor')} className="text-blue-600 text-xs font-medium hover:underline">Vendor</button>
                            <button onClick={() => { setResolving(null); setResolutionNote(''); }} className="text-gray-400 text-xs hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setResolving(d.id)} className="text-ob-purple text-xs font-medium hover:underline">Resolve →</button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
