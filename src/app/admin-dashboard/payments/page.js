'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exportData, filterByDateRange, formatDate, formatCurrency } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';
import DataTable from '@/components/DataTable';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetch('/api/orders?limit=200')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Date filter
  const filterByPeriod = (items, p) => {
    if (p === 'all') return items;
    const now = new Date();
    const days = p === '7d' ? 7 : p === '30d' ? 30 : p === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return items.filter(item => !item.created_at || new Date(item.created_at) >= cutoff);
  };

  const filteredOrders = filterByPeriod(orders, period);
  const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commission = Math.round(totalRevenue * 0.10);
  const pendingSettlements = paidOrders.filter(o => ['processing', 'shipped', 'in_transit'].includes(o.status)).reduce((sum, o) => sum + Number(o.total || 0) * 0.9, 0);
  const failedPayments = filteredOrders.filter(o => o.payment_status === 'failed').length;

  const statusColor = (s) => ({
    paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="admin" requiredPermission="payments">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-ob-navy">Payments & Transactions</h1><p className="text-gray-500 text-sm mt-1">Monitor all payment transactions, commissions and financial activity.</p></div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{p === 'all' ? 'All Time' : p}</button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Total Revenue', v: `₦${totalRevenue.toLocaleString()}`, c: 'text-ob-purple' },
          { l: 'Commission Earned', v: `₦${commission.toLocaleString()}`, c: 'text-green-600' },
          { l: 'Pending Settlements', v: `₦${Math.round(pendingSettlements).toLocaleString()}`, c: 'text-amber-600' },
          { l: 'Failed Payments', v: failedPayments, c: 'text-red-600' },
        ].map((s, i) => <div key={i} className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">{s.l}</p><p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p></div>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-ob-navy">Transaction History</h3>
          <ExportButton
            dateRangeOptions={dateRangeOptions}
            onExport={({ format, dateRange }) => {
              const exportPaid = dateRange ? filterByDateRange(paidOrders, dateRange.start, dateRange.end, 'created_at') : paidOrders;
              exportData({
                format,
                title: 'Payments & Transactions Report',
                filename: 'ojabridge_payments',
                dateRange,
                summary: [
                  { label: 'Total Revenue', value: formatCurrency(exportPaid.reduce((s, o) => s + Number(o.total || 0), 0)) },
                  { label: 'Commission Earned', value: formatCurrency(Math.round(exportPaid.reduce((s, o) => s + Number(o.total || 0), 0) * 0.10)) },
                  { label: 'Failed Payments', value: exportPaid.filter(o => o.payment_status === 'failed').length },
                ],
                columns: [
                  { key: 'order_number', label: 'Order Number' },
                  { key: 'buyer', label: 'Buyer' },
                  { key: 'vendor', label: 'Vendor' },
                  { key: 'total', label: 'Amount', format: (v) => formatCurrency(v) },
                  { key: 'commission', label: 'Commission (10%)', format: (v) => formatCurrency(v) },
                  { key: 'vendorPayout', label: 'Vendor Payout', format: (v) => formatCurrency(v) },
                  { key: 'payment_status', label: 'Payment Status' },
                  { key: 'status', label: 'Order Status' },
                  { key: 'payment_ref', label: 'Payment Ref' },
                  { key: 'created_at', label: 'Date', format: (v) => formatDate(v) },
                ],
                rows: exportPaid.map(o => ({
                  order_number: o.order_number,
                  buyer: o.buyer_name || o.customer_name || '—',
                  vendor: o.vendor_name || '—',
                  total: o.total,
                  commission: Math.round(Number(o.total || 0) * 0.10),
                  vendorPayout: Math.round(Number(o.total || 0) * 0.90),
                  payment_status: o.payment_status,
                  status: o.status,
                  payment_ref: o.payment_ref || o.paystack_ref || '—',
                  created_at: o.created_at,
                })),
              });
            }}
          />
        </div>
        <DataTable
          columns={[
            { key: 'order_number', label: 'Order', render: o => <span className="font-medium text-ob-navy">{o.order_number}</span> },
            { key: 'total', label: 'Amount', render: o => <span className="font-semibold">₦{Number(o.total || 0).toLocaleString()}</span> },
            { key: 'commission', label: 'Commission (10%)', render: o => <span className="text-amber-600">₦{Math.round(Number(o.total || 0) * 0.10).toLocaleString()}</span> },
            { key: 'payout', label: 'Vendor Payout', render: o => <span className="text-green-600">₦{Math.round(Number(o.total || 0) * 0.90).toLocaleString()}</span> },
            { key: 'payment_status', label: 'Payment Status', render: o => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(o.payment_status)}`}>{o.payment_status}</span> },
            { key: 'created_at', label: 'Date', render: o => new Date(o.created_at).toLocaleDateString() },
          ]}
          rows={loading ? [] : paidOrders}
          emptyMessage={loading ? 'Loading transactions…' : 'No transactions yet. Payments will appear here once orders are placed.'}
        />
      </div>
    </DashboardLayout>
  );
}
