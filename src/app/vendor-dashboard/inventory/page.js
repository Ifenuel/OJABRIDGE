'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import ActionMenu from '@/components/ActionMenu';

export default function VendorInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateStock = async (productId) => {
    const stock = parseInt(newStock);
    if (isNaN(stock) || stock < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid stock number' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, stock }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Stock updated successfully' });
        setEditingStock(null);
        loadInventory();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update stock' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const adjustStock = async (product, delta) => {
    const current = product.stock_quantity ?? 0;
    const next = Math.max(0, current + delta);
    await setStockDirect(product, next, `Stock ${delta > 0 ? 'increased' : 'decreased'} to ${next}`);
  };

  const setStockDirect = async (product, value, successText) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: product.id, stock: value }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: successText || `Stock set to ${value}` });
        loadInventory();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update stock' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock <= 5) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700' };
    if (stock <= 20) return { label: 'In Stock', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Well Stocked', color: 'bg-green-100 text-green-700' };
  };

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Inventory</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor and manage your product stock levels.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stock Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: products.length, color: 'text-ob-navy' },
          { label: 'In Stock', value: products.filter(p => (p.stock_quantity ?? 0) > 5).length, color: 'text-green-600' },
          { label: 'Low Stock', value: products.filter(p => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= 5).length, color: 'text-amber-600' },
          { label: 'Out of Stock', value: products.filter(p => (p.stock_quantity ?? 0) === 0).length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Inventory Table — shared responsive DataTable (stacked cards on mobile) */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <DataTable
          columns={[
            { key: 'name', label: 'Product', render: p => (
              <div>
                <p className="text-sm font-medium text-ob-navy">{p.name}</p>
                <p className="text-xs text-gray-400 font-mono">{p.sku || '—'}</p>
              </div>
            ) },
            { key: 'stock_quantity', label: 'Stock', render: p => (
              editingStock === p.id ? (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <input type="number" min="0" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-20 px-2 py-1 border border-ob-purple rounded text-sm" autoFocus />
                  <button onClick={() => updateStock(p.id)} className="text-green-600 text-xs font-medium px-2 py-1 rounded border border-gray-200 hover:bg-green-50">Save</button>
                  <button onClick={() => setEditingStock(null)} className="text-gray-400 text-xs hover:underline">Cancel</button>
                </div>
              ) : (
                <span className="text-sm font-semibold text-ob-navy">{p.stock_quantity ?? 0}</span>
              )
            ) },
            { key: 'status', label: 'Status', render: p => {
              const s = getStockStatus(p.stock_quantity ?? 0);
              return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>;
            } },
            { key: 'total_sold', label: 'Sold', render: p => <span className="text-sm text-gray-500">{p.total_sold || 0}</span> },
          ]}
          rows={loading ? [] : products}
          emptyMessage={loading ? 'Loading inventory…' : 'No products found. Add products from the Products page.'}
          rowKey={(p) => p.id}
          actions={p => (
            <ActionMenu
              actions={[
                { label: 'Update Stock', icon: '📦', onClick: () => { setEditingStock(p.id); setNewStock(String(p.stock_quantity ?? 0)); } },
                { label: 'Add 10 to Stock', icon: '➕', hidden: editingStock === p.id, className: 'text-green-700', onClick: () => adjustStock(p, +10) },
                { label: 'Remove 10 from Stock', icon: '➖', hidden: editingStock === p.id || (p.stock_quantity ?? 0) < 10, className: 'text-amber-700', onClick: () => adjustStock(p, -10) },
                { label: 'Mark Out of Stock', icon: '🚫', hidden: (p.stock_quantity ?? 0) === 0, className: 'text-red-600', confirm: `Mark "${p.name}" as out of stock?`, onClick: () => setStockDirect(p, 0, 'Product marked out of stock') },
                { label: 'Edit Product', icon: '✏️', className: 'text-ob-purple', onClick: () => { window.location.href = '/vendor-dashboard/products'; } },
              ]}
            />
          )}
        />
      </div>
    </DashboardLayout>
  );
}
