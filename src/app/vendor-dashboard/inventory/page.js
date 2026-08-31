'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function VendorInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState('');

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateStock = async (productId) => {
    const stock = parseInt(newStock);
    if (isNaN(stock) || stock < 0) return;
    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stock }),
      });
      setEditingStock(null);
      loadInventory();
    } catch (err) { console.error(err); }
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

      {/* Stock Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: products.length, color: 'text-ob-navy' },
          { label: 'In Stock', value: products.filter(p => p.stock > 5).length, color: 'text-green-600' },
          { label: 'Low Stock', value: products.filter(p => p.stock > 0 && p.stock <= 5).length, color: 'text-amber-600' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Sold</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 text-sm">No products found.</td></tr>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-ob-navy">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{product.sku || '—'}</td>
                      <td className="px-6 py-4">
                        {editingStock === product.id ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-20 px-2 py-1 border border-ob-purple rounded text-sm" autoFocus />
                            <button onClick={() => updateStock(product.id)} className="text-green-600 text-xs font-medium">Save</button>
                            <button onClick={() => setEditingStock(null)} className="text-gray-400 text-xs">Cancel</button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-ob-navy">{product.stock}</span>
                        )}
                      </td>
                      <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stockStatus.color}`}>{stockStatus.label}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.total_sold || 0}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => { setEditingStock(product.id); setNewStock(String(product.stock)); }} className="text-ob-purple text-xs font-medium hover:underline">
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
