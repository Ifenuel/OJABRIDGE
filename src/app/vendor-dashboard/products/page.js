'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

const categories = ['Fashion', 'Beauty', 'Electronics', 'Home & Living', 'Health', 'Accessories', 'Groceries'];

export default function VendorProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '', compareAtPrice: '',
    category: '', stock: '', sku: '', weight: '', tags: '',
    imageUrls: '',
  });

  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    loadProducts();
    fetch('/api/kyc').then(r => r.json()).then(d => {
      if (d.success && d.kyc) setKycStatus(d.kyc.status || 'not_started');
    }).catch(() => {});
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Get vendor profile ID (not user ID) for filtering
      const vendorRes = await fetch('/api/vendors?limit=100');
      const vendorData = await vendorRes.json();
      const myVendor = vendorData.vendors?.find(v => v.user_id === user?.id);
      const vendorId = myVendor?.id || '';
      const res = await fetch(`/api/products?vendor=${vendorId}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          shortDescription: form.shortDescription,
          price: parseFloat(form.price),
          comparePrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
          category: form.category,
          stock: parseInt(form.stock) || 0,
          sku: form.sku || null,
          weight: form.weight ? parseFloat(form.weight) : null,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
          images: form.imageUrls ? form.imageUrls.split(',').map(u => u.trim()).filter(Boolean) : [],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Product submitted for review! It will appear on the marketplace once approved.' });
        setShowAddForm(false);
        setForm({ name: '', description: '', shortDescription: '', price: '', compareAtPrice: '', category: '', stock: '', sku: '', weight: '', tags: '', imageUrls: '' });
        loadProducts();
      } else {
        setMessage({ type: 'error', text: data.error || data.errors?.join(', ') || 'Failed to add product' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSubmitting(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const statusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <DashboardLayout role="vendor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Products</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your product listings on OjaBridge.</p>
        </div>
        <button onClick={() => { if (kycStatus && kycStatus !== 'verified' && kycStatus !== 'VERIFIED') { alert('Please complete KYC verification first.'); return; } setShowAddForm(!showAddForm); }} className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* KYC Warning */}
      {kycStatus && kycStatus !== 'verified' && kycStatus !== 'VERIFIED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-semibold text-red-700">KYC Verification Required</p>
            <p className="text-xs text-red-600">You must complete identity verification before you can add products. <a href="/vendor-dashboard/kyc" className="font-medium underline">Complete KYC →</a></p>
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-ob-navy">Add New Product</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleAddProduct} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="e.g. Premium Wireless Headphones" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                <input type="number" required min="1" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare at Price (₦) <span className="text-gray-400">(optional)</span></label>
                <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={e => setForm({...form, compareAtPrice: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="Original price for discount display" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input type="number" required min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="Product SKU" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description <span className="text-gray-400">(shown in listings)</span></label>
              <input type="text" value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="Brief product summary" maxLength={200} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm resize-none" placeholder="Detailed product description including features, specifications, and what makes this product special..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Images <span className="text-gray-400">(comma separated URLs)</span></label>
              <input type="text" value={form.imageUrls} onChange={e => setForm({...form, imageUrls: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" />
              <p className="text-xs text-gray-400 mt-1">Paste image URLs separated by commas. First image is the main product photo.</p>
              {form.imageUrls && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.imageUrls.split(',').map((url, i) => url.trim() && (
                    <div key={i} className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                      <img src={url.trim()} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400">(comma separated, optional)</span></label>
              <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="wireless, headphones, bluetooth, audio" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-500 text-sm hover:text-gray-700">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none"
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
          <option>All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-gray-500 text-sm">No products found.</p>
                    <button onClick={() => setShowAddForm(true)} className="text-ob-purple text-sm font-semibold mt-2 hover:underline">
                      Add your first product →
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-ob-purple/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <svg className="w-5 h-5 text-ob-purple/40" style={product.images?.[0] ? {display: 'none'} : {}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ob-navy">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.store_name || 'Your Store'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-ob-navy">₦{Number(product.price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.stock_quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(product.moderation_status)}`}>
                        {product.moderation_status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.average_rating || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-ob-purple text-xs">Edit</button>
                        <button className="text-gray-400 hover:text-red-500 text-xs">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
