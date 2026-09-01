'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORY_COLORS = {
  'Electronics': 'from-blue-500 to-cyan-500',
  'Phones': 'from-blue-500 to-cyan-500',
  'Laptops': 'from-blue-500 to-indigo-500',
  'Fashion': 'from-purple-500 to-pink-500',
  'Beauty': 'from-pink-500 to-rose-500',
  'Home & Living': 'from-amber-500 to-orange-500',
  'Health': 'from-green-500 to-emerald-500',
  'Accessories': 'from-indigo-500 to-violet-500',
  'Groceries': 'from-lime-500 to-green-500',
  'Sports': 'from-teal-500 to-cyan-500',
  'Automotive': 'from-slate-500 to-gray-500',
  'Gaming': 'from-violet-500 to-purple-500',
  'Tablets': 'from-blue-500 to-indigo-500',
  'default': 'from-ob-purple to-ob-purple-light',
};

const CATEGORY_ICONS = {
  'Electronics': '📱', 'Phones': '📱', 'Laptops': '💻', 'Fashion': '👔',
  'Beauty': '💄', 'Home & Living': '🏠', 'Health': '💊', 'Accessories': '⌚',
  'Groceries': '🛒', 'Sports': '⚽', 'Automotive': '🚗', 'Gaming': '🎮',
  'Tablets': '📟', 'default': '📦',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/products?limit=200');
        const data = await res.json();
        const products = data.products || [];

        const catMap = {};
        products.forEach(p => {
          if (p.category) {
            if (!catMap[p.category]) catMap[p.category] = { name: p.category, count: 0 };
            catMap[p.category].count++;
          }
        });

        const cats = Object.values(catMap).sort((a, b) => b.count - a.count);
        setCategories(cats);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Categories</h1>
          <p className="text-gray-300">Browse products by category from verified vendors</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl p-6 h-32 animate-pulse" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No categories yet. Products will appear as vendors list them.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map(cat => (
                <Link key={cat.name} href={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover group">
                  <div className={`w-14 h-14 bg-gradient-to-br ${CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.default} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    {CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.default}
                  </div>
                  <h3 className="font-bold text-ob-navy text-lg mb-1 group-hover:text-ob-purple transition-colors">{cat.name}</h3>
                  <p className="text-ob-purple text-sm font-semibold">{cat.count} products</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
