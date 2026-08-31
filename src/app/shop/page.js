'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import HeartButton from '@/components/HeartButton';

const categories = ['All', 'Phones', 'Laptops', 'Tablets', 'Electronics', 'Accessories', 'Gaming', 'Fashion', 'Beauty', 'Health', 'Home & Living'];

// Fallback products shown only when DB is not connected
// No fallback — all products come from the database

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?limit=50`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (sortBy === 'price_low') url += `&sort=price-low`;
      else if (sortBy === 'price_high') url += `&sort=price-high`;
      else if (sortBy === 'popular') url += `&sort=popular`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.products) {
        setProducts(data.products);
        setDbConnected(data.dbConnected !== false);
      } else {
        setProducts([]);
        setDbConnected(data.dbConnected !== false);
      }
    } catch (err) {
      setProducts([]);
      setDbConnected(false);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num)) return '₦0';
    return `₦${num.toLocaleString()}`;
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <section className="min-h-screen bg-ob-light">
      {/* Header */}
      <div className="bg-ob-navy text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Shop</h1>
          <p className="text-gray-300 mt-2">Discover products from verified vendors</p>


          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-gray-900 bg-white/95 focus:bg-white outline-none"
              />
            </div>
            <button type="submit" className="bg-ob-purple hover:bg-ob-purple-dark px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-ob-purple text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500">No products found.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); loadProducts(); }} className="text-ob-purple text-sm font-semibold hover:underline mt-2">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Link key={product.id} href={`/shop/product/${product.id}`} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
                  )}
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-ob-purple text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      {product.badge}
                    </span>
                  )}
                  <div className="absolute top-3 right-3">
                    <HeartButton productId={product.id} size="small" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-ob-purple font-medium">{product.store_name || 'Vendor'}</p>
                  <h3 className="text-sm font-semibold text-ob-navy mt-1 line-clamp-2 group-hover:text-ob-purple transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    {product.average_rating > 0 && (
                      <>
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="text-xs text-gray-500">{Number(product.average_rating).toFixed(1)} ({product.total_reviews || 0})</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-ob-navy">{formatPrice(product.price)}</span>
                    {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                      <>
                        <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                        <span className="text-xs text-red-500 font-semibold">-{Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100)}%</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
