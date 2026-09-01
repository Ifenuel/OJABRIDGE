'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export default function RetailerDashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    fetch('/api/kyc').then(r => r.json()).then(d => {
      if (d.success && d.kyc) setKycStatus(d.kyc.status || 'not_started');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [prodsRes, vendorsRes, ordersRes] = await Promise.allSettled([
          fetch('/api/products?limit=20').then(r => r.json()),
          fetch('/api/vendors?limit=10').then(r => r.json()),
          fetch('/api/orders?limit=50').then(r => r.json()),
        ]);
        if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value.products || []);
        if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.vendors || []);
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const recentProducts = products.slice(0, 6);
  const verifiedVendors = vendors.filter(v => v.kyc_status === 'VERIFIED');

  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Retailer Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name || 'Retailer'}. Source products from verified vendors.</p>
      </div>

      {/* KYC Warning */}
      {kycStatus && kycStatus !== 'verified' && kycStatus !== 'VERIFIED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-semibold text-amber-700">Complete Your Verification</p>
            <p className="text-xs text-amber-600">Verify your identity to unlock full marketplace features. <a href="/retailer-dashboard/kyc" className="font-medium underline">Complete KYC →</a></p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Verified Vendors', value: verifiedVendors.length, color: 'text-green-600' },
          { label: 'Available Products', value: products.length, color: 'text-ob-purple' },
          { label: 'My Orders', value: orders.length, color: 'text-blue-600' },
          { label: 'Categories', value: [...new Set(products.map(p => p.category).filter(Boolean))].length, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Browse Products', href: '/shop', icon: '🛍️' },
          { label: 'My Orders', href: '/account/orders', icon: '📦' },
          { label: 'Find Vendors', href: '/shop', icon: '🏪' },
          { label: 'Contact Support', href: '/contact', icon: '💬' },
        ].map((a, i) => (
          <Link key={i} href={a.href} className="p-4 rounded-xl border border-gray-100 hover:border-ob-purple/30 hover:bg-ob-purple/5 transition-all text-center">
            <span className="text-2xl">{a.icon}</span>
            <p className="text-xs font-medium text-ob-navy mt-2">{a.label}</p>
          </Link>
        ))}
      </div>

      {/* Featured Products from Verified Vendors */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ob-navy">Featured Products</h3>
          <Link href="/shop" className="text-ob-purple text-xs font-medium hover:underline">View All →</Link>
        </div>
        {loading ? <div className="text-center py-8"><div className="animate-spin h-6 w-6 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div> : recentProducts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No products available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProducts.map(p => (
              <Link key={p.id} href={`/shop/product/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-ob-purple/5 transition-colors">
                <div className="w-12 h-12 bg-ob-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-lg" /> : <svg className="w-6 h-6 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ob-navy truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.store_name || 'Vendor'}</p>
                </div>
                <span className="text-sm font-bold text-ob-navy">₦{Number(p.price).toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Verified Vendors */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-bold text-ob-navy mb-4">Verified Vendors</h3>
        {verifiedVendors.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No verified vendors yet.</p>
        ) : (
          <div className="space-y-3">
            {verifiedVendors.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ob-purple rounded-full flex items-center justify-center text-white text-sm font-bold">{(v.store_name || 'V')[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-ob-navy">{v.store_name}</p>
                    <p className="text-xs text-gray-400">{v.business_name || 'Verified Vendor'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{v.total_orders || 0} orders</p>
                  {v.average_rating > 0 && <p className="text-xs text-amber-600">⭐ {Number(v.average_rating).toFixed(1)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
