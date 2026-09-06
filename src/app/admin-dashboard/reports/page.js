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

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports?limit=100');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {}
    setLoading(false);
  };

  const resolveReport = async (reportId, status) => {
    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId: reportId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Report resolved' });
        loadReports();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error' }); }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const openCount = reports.filter(r => ['open', 'under_review', 'escalated'].includes(r.status)).length;
  const resolvedCount = reports.filter(r => ['resolved_favor_buyer', 'resolved_favor_vendor', 'closed'].includes(r.status)).length;

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Customer Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Review and address customer reports about vendors and products.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { l: 'Open Reports', value: openCount, c: 'text-red-600', icon: '🔴' },
          { l: 'Under Review', value: reports.filter(r => r.status === 'under_review').length, c: 'text-amber-600', icon: '🟡' },
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
        {['all', 'open', 'under_review', 'escalated', 'resolved_favor_buyer', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">Reports ({filtered.length})</h3>
          <ExportButton
            dateRangeOptions={dateRangeOptions}
            onExport={({ format, dateRange }) => {
              const exportRows = dateRange ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'created_at') : filtered;
              exportData({
                format,
                title: 'Customer Reports',
                filename: 'ojabridge_reports',
                dateRange,
                summary: [
                  { label: 'Total Reports', value: reports.length },
                  { label: 'Exported', value: exportRows.length },
                ],
                columns: [
                  { key: 'id', label: 'Report ID' },
                  { key: 'type', label: 'Type' },
                  { key: 'reporter', label: 'Reported By' },
                  { key: 'target', label: 'Target' },
                  { key: 'reason', label: 'Reason' },
                  { key: 'description', label: 'Description' },
                  { key: 'status', label: 'Status', format: (v) => (v || '').replace(/_/g, ' ') },
                  { key: 'created_at', label: 'Date Filed', format: (v) => formatDate(v) },
                ],
                rows: exportRows.map(r => ({
                  id: r.id?.slice(0, 8),
                  type: r.reason?.startsWith('Report:') ? 'Report' : 'Dispute',
                  reporter: r.reporter_name || r.user_name || '—',
                  target: r.target_name || r.vendor_name || '—',
                  reason: r.reason,
                  description: r.description,
                  status: r.status,
                  created_at: r.created_at,
                })),
              });
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Type</th>
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
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No reports found.</td></tr>
              ) : filtered.map(r => {
                const isReport = r.reason?.startsWith('Report:');
                return (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${isReport ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isReport ? 'Report' : 'Dispute'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-ob-navy">{r.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[250px] truncate">{r.description}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      r.status === 'open' ? 'bg-red-100 text-red-700' :
                      r.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'escalated' ? 'bg-red-200 text-red-800' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {r.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {['open', 'under_review', 'escalated'].includes(r.status) ? (
                      <div className="flex gap-2">
                        <button onClick={() => resolveReport(r.id, 'resolved_favor_buyer')} className="text-green-600 text-xs font-medium hover:underline">Favor Buyer</button>
                        <button onClick={() => resolveReport(r.id, 'closed')} className="text-gray-500 text-xs font-medium hover:underline">Close</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Resolved</span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
