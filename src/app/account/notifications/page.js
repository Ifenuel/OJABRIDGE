'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function CustomerNotificationsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const res = await fetch('/api/notifications?limit=100', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
      setLoadingData(false);
    }
    load();
  }, [user]);

  const markRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const notifIcon = (type) => {
    const icons = {
      order_confirmed: '✅', order_shipped: '🚚', order_delivered: '📦',
      order_processing: '⏳', payment_success: '💳', payment_failed: '❌',
      vendor_approved: '🎉', kyc_update: '📋', security_alert: '🔒',
      review: '⭐', settlement: '💰', refund: '🔄', announcement: '📢',
    };
    return icons[type] || '🔔';
  };

  const filtered = filter === 'all' ? notifications :
    filter === 'unread' ? notifications.filter(n => !n.is_read) :
    notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return (
    <div className="min-h-screen bg-ob-light flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated || !user) return null;

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-ob-purple text-sm font-medium hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
          { value: 'order_confirmed', label: 'Orders' },
          { value: 'payment_success', label: 'Payments' },
          { value: 'security_alert', label: 'Security' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-ob-purple text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'
            }`}
          >
            {f.label}
            {f.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔔</span>
          </div>
          <h3 className="font-bold text-ob-navy mb-2">No notifications</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'unread' ? 'All notifications have been read.' : 'You\'ll see updates about orders, payments, and more here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => (
            <button
              key={notif.id}
              onClick={() => !notif.is_read && markRead(notif.id)}
              className={`w-full text-left bg-white p-4 sm:p-5 rounded-xl border transition-all ${
                !notif.is_read ? 'border-ob-purple/20 bg-ob-purple/5 hover:bg-ob-purple/10' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 flex-shrink-0">{notifIcon(notif.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm ${!notif.is_read ? 'font-bold text-ob-navy' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    </div>
                    {!notif.is_read && <div className="w-2.5 h-2.5 bg-ob-purple rounded-full mt-1 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
