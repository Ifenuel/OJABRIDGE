'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=100').then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusBadge = (s) => ({ published: 'bg-green-100 text-green-700', pending_review: 'bg-amber-100 text-amber-700', draft: 'bg-gray-100 text-gray-600', suspended: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600');

  return (
    <DashboardLayout role="admin">
      <div className="mb-8"><h1 className="text-2xl font-bold text-ob-navy">Products</h1><p className="text-gray-500 text-sm mt-1">Review, approve and manage all marketplace product listings.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: products.length, color: 'text-ob-navy' },
          { label: 'Published', value: products.filter(p => p.status === 'published').length, color: 'text-green-600' },
          { label: 'Pending Review', value: products.filter(p => p.status === 'pending_review').length, color: 'text-amber-600' },
          { label: 'Suspended', value: products.filter(p => p.status === 'suspended').length, color: 'text-red-600' },
        ].map((s, i) => <div key={i} className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs text-gray-500">{s.label}</p><p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p></div>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="px-6 py-4 font-medium">Product</th><th className="px-6 py-4 font-medium">Price</th><th className="px-6 py-4 font-medium">Vendor</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>) : products.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 text-sm">No products yet. Products submitted by vendors will appear here.</td></tr> : products.map(p => <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium text-ob-navy">{p.name}</td><td className="px-6 py-4 text-sm">₦{Number(p.price).toLocaleString()}</td><td className="px-6 py-4 text-sm text-gray-500">{p.store_name || '—'}</td><td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>{p.status?.replace('_', ' ')}</span></td><td className="px-6 py-4"><div className="flex space-x-2"><button className="text-ob-purple text-xs font-medium hover:underline">Review</button><button className="text-green-600 text-xs font-medium hover:underline">Approve</button><button className="text-red-500 text-xs font-medium hover:underline">Reject</button></div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
