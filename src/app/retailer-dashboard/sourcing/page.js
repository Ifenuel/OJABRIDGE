'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function RetailerSourcingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('browse'); // browse | create | requests
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Product creation form
  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '', compareAtPrice: '',
    category: '', stock: '', sku: '', weight: '', tags: '', imageUrls: '',
  });

  const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Health', 'Accessories', 'Groceries', 'Sports', 'Automotive', 'Others'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = products.filter(p => {
    if (category && p.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage({ type: '', text: '' });
    try {
      const images = form.imageUrls ? form.imageUrls.split(',').map(u => u.trim()).filter(Boolean) : [];
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          short_description: form.shortDescription,
          price: parseFloat(form.price),
          compare_at_price: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
          category: form.category,
          stock: parseInt(form.stock) || 0,
          sku: form.sku || null,
          weight: form.weight || null,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          images,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Product created successfully!' });
        setForm({ name: '', description: '', shortDescription: '', price: '', compareAtPrice: '', category: '', stock: '', sku: '', weight: '', tags: '', imageUrls: '' });
        loadProducts();
        setTimeout(() => { setTab('browse'); setMessage({ type: '', text: '' }); }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || data.errors?.[0] || 'Failed to create product' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setCreating(false);
  };

  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Product Sourcing</h1>
        <p className="text-gray-500 text-sm mt-1">Browse products from vendors or create your own listings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        {[
          { id: 'browse', label: 'Browse Products', icon: '🔍' },
          { id: 'create', label: 'Create Product', icon: '➕' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-ob-purple text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-500 text-sm">No products found.</p>
              <button onClick={() => setTab('create')} className="text-ob-purple text-sm font-semibold hover:underline mt-2">Create Your First Product →</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-ob-navy text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.short_description || p.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-ob-purple">₦{Number(p.price || 0).toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${(p.stock || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {(p.stock || 0) > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <Link href={`/shop/product/${p.id}`} className="block mt-3 text-center text-xs font-medium text-ob-purple hover:underline py-2 border border-ob-purple/20 rounded-lg hover:bg-ob-purple/5">
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE TAB */}
      {tab === 'create' && (
        <form onSubmit={handleCreateProduct} className="max-w-2xl space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Product Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="e.g. Samsung Galaxy S24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input type="text" value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Brief summary" maxLength={200} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none" placeholder="Detailed product description..." />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Pricing & Stock</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                <input type="number" required min="1" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare at Price</label>
                <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={e => setForm({...form, compareAtPrice: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                <input type="number" required min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="0" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Optional" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Product Images</h3>
            <p className="text-xs text-gray-400 mb-3">Upload from your device or paste a URL. First image is the main product photo.</p>
            
            {/* Upload from device */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-ob-purple hover:bg-ob-purple/5 transition-all text-sm text-gray-600 mb-3">
              <svg className="w-5 h-5 text-ob-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Upload from device
              <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const file of files) {
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.success && data.url) {
                      const current = form.imageUrls ? form.imageUrls.split(',').map(u=>u.trim()).filter(Boolean) : [];
                      setForm({...form, imageUrls: [...current, data.url].join(', ')});
                    }
                  } catch (err) { console.error('Upload failed:', err); }
                }
              }} />
            </label>

            {/* Or paste URL */}
            <div className="flex gap-2">
              <input type="url" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Or paste image URL..." id="retailerImgUrl"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const val = e.target.value.trim(); if (val && val.startsWith('http')) { const current = form.imageUrls ? form.imageUrls.split(',').map(u=>u.trim()).filter(Boolean) : []; if (!current.includes(val)) { setForm({...form, imageUrls: [...current, val].join(', ')}); } e.target.value = ''; } } }} />
              <button type="button" onClick={() => { const inp = document.getElementById('retailerImgUrl'); const val = inp?.value?.trim(); if (val && val.startsWith('http')) { const current = form.imageUrls ? form.imageUrls.split(',').map(u=>u.trim()).filter(Boolean) : []; if (!current.includes(val)) { setForm({...form, imageUrls: [...current, val].join(', ')}); } inp.value = ''; } }}
                className="px-4 py-2.5 bg-ob-purple text-white text-sm rounded-lg hover:bg-ob-purple-dark whitespace-nowrap">+ Add URL</button>
            </div>

            {/* Image previews */}
            {form.imageUrls && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {form.imageUrls.split(',').map((url, i) => url.trim() && (
                  <div key={i} className="relative group w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <img src={url.trim()} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    <button type="button" onClick={() => { const imgs = form.imageUrls.split(',').map(u=>u.trim()).filter(Boolean); imgs.splice(i, 1); setForm({...form, imageUrls: imgs.join(', ')}); }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                    {i === 0 && <span className="absolute bottom-0.5 left-0.5 bg-ob-purple text-white text-[8px] px-1 rounded">Main</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={creating}
              className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-8 py-2.5 rounded-xl transition-all disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Product'}
            </button>
            <button type="button" onClick={() => setTab('browse')} className="text-gray-500 text-sm hover:text-gray-700 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
