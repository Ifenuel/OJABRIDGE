'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Products</h1><p className="text-gray-500 text-sm mt-1">Review, approve and manage all marketplace product listings.</p></div>
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
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="px-6 py-4 font-medium">Product</th><th className="px-6 py-4 font-medium">Price</th><th className="px-6 py-4 font-medium">Stock</th><th className="px-6 py-4 font-medium">Vendor</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : filtered.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 text-sm">No products found.</td></tr> : filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-ob-navy max-w-[200px] truncate">{p.name}</td>
                  <td className="px-6 py-4 text-sm">₦{Number(p.price).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.stock_quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.store_name || '—'}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(p.moderation_status)}`}>{p.moderation_status?.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {p.moderation_status !== 'approved' && <button onClick={() => moderateProduct(p.id, 'approved')} className="text-green-600 text-xs font-medium hover:underline">Approve</button>}
                      {p.moderation_status !== 'rejected' && <button onClick={() => moderateProduct(p.id, 'rejected')} className="text-red-500 text-xs font-medium hover:underline">Reject</button>}
                      {p.moderation_status !== 'suspended' && <button onClick={() => moderateProduct(p.id, 'suspended')} className="text-orange-500 text-xs font-medium hover:underline">Suspend</button>}
                    </div>
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
