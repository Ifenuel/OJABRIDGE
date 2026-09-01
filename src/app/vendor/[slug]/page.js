'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VendorStorePage({ params }) {
  const slug = params?.slug || '';
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const vendorsRes = await fetch(`/api/vendors?limit=100`);
        const vendorsData = await vendorsRes.json();
        const found = vendorsData.vendors?.find(v => v.store_slug === slug);
        if (!found) { setError('Vendor not found'); setLoading(false); return; }
        setVendor(found);

        const prodRes = await fetch(`/api/products?vendor=${found.id}&limit=50`);
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      } catch (e) { setError('Failed to load vendor'); }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-ob-light flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !vendor) return (
    <div className="min-h-screen bg-ob-light flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🏪</p>
        <h1 className="text-2xl font-bold text-ob-navy mb-2">Vendor Not Found</h1>
        <p className="text-gray-500 mb-6">This store may not exist or has been removed.</p>
        <Link href="/shop" className="bg-ob-purple text-white px-6 py-3 rounded-xl font-semibold">Browse Shop</Link>
      </div>
    </div>
  );

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-20 h-20 bg-ob-purple rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {(vendor.store_name || 'V').charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl font-bold">{vendor.store_name}</h1>
                {vendor.kyc_status === 'VERIFIED' && (
                  <span className="bg-ob-lime/20 text-ob-lime text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
              {vendor.store_description && <p className="text-gray-300 text-sm">{vendor.store_description}</p>}
              {vendor.business_name && <p className="text-gray-400 text-xs mt-1">{vendor.business_name}</p>}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                {vendor.average_rating > 0 && (
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-ob-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span>{Number(vendor.average_rating).toFixed(1)} ({vendor.total_reviews} reviews)</span>
                  </span>
                )}
                <span>{products.length} products</span>
                {vendor.business_city && <span>{vendor.business_city}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-ob-navy mb-6">Products by {vendor.store_name}</h2>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No products listed yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/shop/product/${product.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover group">
                  <div className="aspect-square bg-gradient-to-br from-ob-purple/5 to-ob-lime/5 flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-20 h-20 bg-ob-purple/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-ob-navy text-sm mb-2 group-hover:text-ob-purple transition-colors">{product.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-ob-navy">₦{Number(product.price).toLocaleString()}</span>
                      {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                        <span className="text-sm text-gray-400 line-through">₦{Number(product.compare_price).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
