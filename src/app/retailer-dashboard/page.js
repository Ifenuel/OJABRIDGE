'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

const StatCard = ({ label, value, icon, change, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);
  return (
    <div className={`bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {change && <span className="text-xs text-gray-400">{change}</span>}
      </div>
      <p className="text-2xl font-bold text-ob-navy">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default function RetailerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    sourcingRequests: 0,
    productsDiscovered: 0,
  });

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const res = await fetch('/api/orders?limit=200').then(r => r.json());
        if (res.success && res.orders) {
          setStats({
            totalOrders: res.orders.length,
            totalSpent: res.orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
            sourcingRequests: 0,
            productsDiscovered: 0,
          });
        }
      } catch (e) {}
    }
    loadData();
  }, [user]);

  const quickActions = [
    { label: 'Browse Products', href: '/shop', icon: '🛒', color: 'bg-purple-50 text-purple-600', desc: 'Discover new products' },
    { label: 'My Orders', href: '/retailer-dashboard/orders', icon: '📦', color: 'bg-blue-50 text-blue-600', desc: 'Track your orders' },
    { label: 'Sourcing', href: '/retailer-dashboard/sourcing', icon: '🔍', color: 'bg-green-50 text-green-600', desc: 'Product sourcing requests' },
    { label: 'Analytics', href: '/retailer-dashboard/analytics', icon: '📊', color: 'bg-amber-50 text-amber-600', desc: 'Purchase insights' },
    { label: 'Profile', href: '/retailer-dashboard/profile', icon: '👤', color: 'bg-indigo-50 text-indigo-600', desc: 'Manage your account' },
  ];

  return (
    <DashboardLayout role="retailer">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Welcome back, {user?.name?.split(' ')[0] || 'Retailer'}</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your sourcing, orders and product discovery.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" change="All time" delay={0} />
        <StatCard label="Total Spent" value={`₦${stats.totalSpent.toLocaleString()}`} icon="💰" change="All time" delay={100} />
        <StatCard label="Sourcing Requests" value={stats.sourcingRequests} icon="🔍" change="Pending" delay={200} />
        <StatCard label="Products Discovered" value={stats.productsDiscovered} icon="🛍️" change="Saved" delay={300} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-ob-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md hover:border-ob-purple/20 transition-all group">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${action.color} text-xl mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </span>
              <h3 className="font-semibold text-ob-navy text-sm">{action.label}</h3>
              <p className="text-gray-400 text-xs mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-ob-navy">Recent Orders</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No orders yet.</p>
          <Link href="/shop" className="text-ob-purple text-sm font-semibold hover:underline mt-2 inline-block">
            Browse Products →
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
