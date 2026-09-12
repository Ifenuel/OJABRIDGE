'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ActionMenu from '@/components/ActionMenu';
import DataTable from '@/components/DataTable';
import { exportData, filterByDateRange, formatDate, formatCurrency } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';

const dateRangeOptions = [
  { key: '7d', label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '30d', label: 'Last 30 Days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '90d', label: 'Last 90 Days', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  { key: '12m', label: 'Last 12 Months', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?admin=true&limit=200');
      const d = await res.json();
      setProducts(d.products || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const moderateProduct = async (productId, status) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, moderation_status: status }),
      });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) { console.error(err); }
  };

  // Bulk moderation — approve/reject all selected products at once
  const bulkModerate = async (status) => {
    if (selected.size === 0) return;
    const verb = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'suspend';
    if (!confirm(`${verb.toUpperCase()} ${selected.size} selected product${selected.size > 1 ? 's' : ''}?`)) return;
    setBulkBusy(true);
    setBulkMsg('');
    let ok = 0, fail = 0;
    for (const id of selected) {
      try {
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id, moderation_status: status }),
        });
        const data = await res.json();
        if (data.success) ok++; else fail++;
      } catch { fail++; }
    }
    setBulkMsg(`${ok} product${ok !== 1 ? 's' : ''} ${status}${fail ? `, ${fail} failed` : ''}`);
    setSelected(new Set());
    setBulkBusy(false);
    loadProducts();
    setTimeout(() => setBulkMsg(''), 5000);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  const filtered = products.filter(p => {
    if (filter !== 'all' && p.moderation_status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.store_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const statusBadge = (s) => ({ approved: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-700', suspended: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="admin" requiredPermission="products">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Products</h1>
          <p className="text-gray-500 text-sm mt-1">Review, approve and manage all marketplace product listings.</p>
        </div>
        {/* Bulk actions — visible when products are selected */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">{selected.size} selected</span>
            <button onClick={() => bulkModerate('approved')} disabled={bulkBusy}
              className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">
              ✅ Approve All
            </button>
            <button onClick={() => bulkModerate('rejected')} disabled={bulkBusy}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">
              ❌ Reject All
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
          </div>
        )}
        {bulkMsg && <span className="text-xs text-green-600 font-medium">{bulkMsg}</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: products.length, color: 'text-ob-navy' },
          { label: 'Approved', value: products.filter(p => p.moderation_status === 'approved').length, color: 'text-green-600' },
          { label: 'Pending Review', value: products.filter(p => p.moderation_status === 'pending').length, color: 'text-amber-600' },
          { label: 'Rejected', value: products.filter(p => p.moderation_status === 'rejected').length, color: 'text-red-600' },
        ].map((s, i) => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs text-gray-500">{s.label}</p><p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p></div>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none flex-1 max-w-sm" />
        <ExportButton
          dateRangeOptions={dateRangeOptions}
          onExport={({ format, dateRange }) => {
            const exportRows = dateRange ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'created_at') : filtered;
            exportData({
              format,
              title: 'Products Report',
              filename: 'ojabridge_products_report',
              dateRange,
              columns: [
                { key: 'name', label: 'Product Name' },
                { key: 'price', label: 'Price', format: (v) => `₦${Number(v).toLocaleString()}` },
                { key: 'stock_quantity', label: 'Stock' },
                { key: 'store_name', label: 'Vendor' },
                { key: 'moderation_status', label: 'Status' },
                { key: 'category', label: 'Category' },
                { key: 'created_at', label: 'Created', format: (v) => formatDate(v) },
              ],
              rows: exportRows,
              summary: [
                { label: 'Total Products', value: products.length },
                { label: 'Exported', value: exportRows.length },
              ],
            });
          }}
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Bulk-select header (desktop + mobile) */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} className="rounded border-gray-300 text-ob-purple focus:ring-ob-purple" />
          <span className="text-xs text-gray-500">Select all ({filtered.length})</span>
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Product', render: p => <span className="font-medium text-ob-navy">{p.name}</span> },
            { key: 'price', label: 'Price', render: p => `₦${Number(p.price).toLocaleString()}` },
            { key: 'stock_quantity', label: 'Stock', render: p => p.stock_quantity },
            { key: 'store_name', label: 'Vendor', render: p => p.store_name || '—' },
            { key: 'moderation_status', label: 'Status', render: p => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(p.moderation_status)}`}>{p.moderation_status?.replace('_', ' ')}</span> },
          ]}
          rows={loading ? [] : filtered}
          emptyMessage={loading ? 'Loading products…' : 'No products found.'}
          actions={p => (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-gray-300 text-ob-purple focus:ring-ob-purple" />
                Select
              </label>
              <ActionMenu actions={[
                { label: 'Approve', icon: '✅', hidden: p.moderation_status === 'approved', className: 'text-green-700', onClick: () => moderateProduct(p.id, 'approved') },
                { label: 'Reject', icon: '❌', hidden: p.moderation_status === 'rejected', className: 'text-red-600', confirm: `Reject "${p.name}"?`, onClick: () => moderateProduct(p.id, 'rejected') },
                { label: 'Suspend', icon: '⚠️', hidden: p.moderation_status === 'suspended', className: 'text-orange-600', confirm: `Suspend "${p.name}"?`, onClick: () => moderateProduct(p.id, 'suspended') },
                { label: 'View in Shop', icon: '👁️', onClick: () => window.open(`/shop/product/${p.id}`, '_blank') },
              ]} />
            </div>
          )}
        />
      </div>
    </DashboardLayout>
  );
}
