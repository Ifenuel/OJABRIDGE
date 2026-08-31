'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { DashboardPieChart, DashboardBarChart, DashboardLineChart, StatCard } from '@/components/Charts';

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  // Fetch real data from database
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [ordersRes, notifRes] = await Promise.allSettled([
          fetch('/api/orders?limit=50').then(r => r.json()),
          fetch('/api/notifications?limit=20').then(r => r.json()),
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
          setOrders(ordersRes.value.orders || []);
        }
        if (notifRes.status === 'fulfilled' && notifRes.value.success) {
          setNotifications(notifRes.value.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load account data:', err);
      }
      setLoadingData(false);
    }
    loadData();
  }, [user]);

  // Compute stats from real orders
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => ['pending', 'processing', 'shipped', 'in_transit'].includes(o.status)).length;
  const avgOrderValue = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  // Chart data from real orders
  const now = new Date();
  const spendingByMonth = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = (now.getMonth() - 5 + i + 12) % 12;
    const month = new Date(now.getFullYear(), monthIdx, 1).toLocaleString('en', { month: 'short' });
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === monthIdx && o.payment_status === 'paid';
    });
    return { name: month, value: monthOrders.reduce((s, o) => s + Number(o.total || 0), 0) };
  });

  const orderStatusData = [
    { name: 'Completed', value: completedOrders },
    { name: 'In Transit', value: orders.filter(o => o.status === 'shipped' || o.status === 'in_transit').length },
    { name: 'Processing', value: orders.filter(o => o.status === 'processing').length },
    { name: 'Pending', value: pendingOrders },
  ];

  if (loading) return (
    <div className="min-h-screen bg-ob-light flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated || !user) return null;

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-ob-navy to-ob-purple rounded-2xl p-6 sm:p-8 text-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user.name?.split(' ')[0] || 'there'}!</h1>
              <p className="text-purple-200 text-sm mt-1">{user.email}</p>
              <p className="text-purple-300 text-xs mt-1">
                Member since {new Date(user.created_at || Date.now()).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Link href="/shop" className="bg-ob-lime text-ob-navy font-semibold px-6 py-3 rounded-xl text-sm hover:bg-ob-lime-dark transition-colors inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={orders.length} icon="📦" color="text-blue-600" change="All time" />
        <StatCard label="Total Spent" value={`₦${totalSpent.toLocaleString()}`} icon="💰" color="text-ob-purple" change="All time" />
        <StatCard label="Notifications" value={unreadNotifs} icon="🔔" color="text-red-500" change="Unread" />
        <StatCard label="Avg. Order" value={`₦${avgOrderValue.toLocaleString()}`} icon="📊" color="text-ob-lime-dark" change="Per order" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <DashboardBarChart data={spendingByMonth} title="Monthly Spending" xKey="name" yKey="value" color="#5B21B6" />
        <DashboardPieChart data={orderStatusData} title="Order Status Breakdown" height={260} innerRadius={50} outerRadius={90} />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Orders', href: '/account/orders', icon: '📦', color: 'bg-blue-50 text-blue-600', desc: `${orders.length} total` },
          { label: 'Favorites', href: '/favorites', icon: '❤️', color: 'bg-red-50 text-red-500', desc: 'Saved items' },
          { label: 'Profile Settings', href: '/account/profile', icon: '👤', color: 'bg-ob-purple/10 text-ob-purple', desc: 'Edit your info' },
          { label: 'Security', href: '/account/security', icon: '🔒', color: 'bg-green-50 text-green-600', desc: 'Password & MFA' },
        ].map((action, i) => (
          <Link key={i} href={action.href} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-lg mb-3`}>{action.icon}</div>
            <p className="font-semibold text-ob-navy text-sm group-hover:text-ob-purple transition-colors">{action.label}</p>
            <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Two Column: Orders + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ob-navy">Recent Orders</h3>
            <Link href="/account/orders" className="text-ob-purple text-sm font-medium hover:underline">View All →</Link>
          </div>
          {loadingData ? (
            <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <p className="text-gray-400 text-sm font-medium">No orders yet</p>
              <p className="text-gray-300 text-xs mt-1 mb-4">Start shopping to see your orders here</p>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-ob-purple text-white text-sm px-5 py-2.5 rounded-xl hover:bg-ob-purple-dark transition-colors">Browse Products</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ob-purple/10 rounded-xl flex items-center justify-center text-ob-purple text-sm font-bold">
                      #{(order.order_number || '').slice(-3)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ob-navy">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ob-navy">₦{Number(order.total || 0).toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {(order.status || 'pending').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Recent Notifications</h3>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 8).map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-2 rounded-lg ${!n.is_read ? 'bg-ob-purple/5' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-ob-purple' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-300 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
            <Link href="/support" className="block text-sm text-ob-purple hover:underline">Visit Help Center →</Link>
            <Link href="/contact" className="block text-sm text-gray-500 hover:text-ob-purple">Contact Support →</Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
