'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import HeartButton from '@/components/HeartButton';

export default function FavoritesPage() {
  const { isAuthenticated, user } = useAuth();
  const { favorites, favoritesCount, loading } = useFavorites();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) { setProducts([]); setLoadingProducts(false); return; }
    // Fetch all products then filter to favorited ones
    fetch('/api/products?limit=200')
      .then(r => r.json())
      .then(d => {
        const allProducts = d.products || [];
        const matched = allProducts.filter(p => favorites.includes(p.id));
        setProducts(matched);
        setLoadingProducts(false);
      })
      .catch(() => { setProducts([]); setLoadingProducts(false); });
  }, [favorites]);

  const formatPrice = (price) => {
    const num = Number(price);
    return isNaN(num) ? '₦0' : `₦${num.toLocaleString()}`;
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-ob-light flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-ob-purple/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-ob-navy mb-2">Your Favorites</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to see your saved products.</p>
          <Link href="/login" className="inline-block bg-ob-purple text-white px-6 py-3 rounded-xl font-medium hover:bg-ob-purple-dark transition">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-ob-light">
      <div className="bg-ob-navy text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">My Favorites</h1>
          <p className="text-gray-300 text-sm mt-1">{favoritesCount} saved product{favoritesCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loadingProducts ? (
          <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-3">❤️</div>
            <p className="text-gray-500 text-sm">No favorites yet.</p>
            <p className="text-gray-400 text-xs mt-1">Tap the heart icon on any product to save it here.</p>
            <Link href="/shop" className="text-ob-purple text-sm font-semibold hover:underline mt-3 inline-block">Browse Products →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
                  )}
                  <div className="absolute top-3 right-3">
                    <HeartButton productId={product.id} size="small" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-ob-purple font-medium">{product.store_name || 'Vendor'}</p>
                  <h3 className="text-sm font-semibold text-ob-navy mt-1 line-clamp-2">{product.name}</h3>
                  <p className="text-lg font-bold text-ob-navy mt-2">{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
