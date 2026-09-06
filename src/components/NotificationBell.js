'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * NotificationBell — Shows notification count badge and dropdown
 * Shows notification details INLINE — does NOT navigate away
 * Auto-marks as read when expanded
 */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setExpandedId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=15');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Mark as read when expanded
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.is_read) {
        markAsRead(id);
      }
    }
  };

  // Get action link based on notification type
  const getActionInfo = (notif) => {
    const type = notif.type || notif.entity_type || '';
    if (type.includes('order')) return { label: 'View Orders', href: null };
    if (type.includes('kyc') || type.includes('vendor')) return { label: 'View Vendors', href: null };
    if (type.includes('product')) return { label: 'View Products', href: null };
    if (type.includes('payment') || type.includes('settlement')) return { label: 'View Payments', href: null };
    if (type.includes('dispute')) return { label: 'View Disputes', href: null };
    if (type.includes('user')) return { label: 'View Users', href: null };
    return { label: 'View Details', href: null };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-ob-purple transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ob-navy text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-ob-purple/10 text-ob-purple text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-ob-purple hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-300 text-xs mt-1">You&apos;ll see activity updates here</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(n => {
                const isExpanded = expandedId === n.id;
                const actionInfo = getActionInfo(n);
                return (
                  <div
                    key={n.id}
                    className={`border-b border-gray-50 transition-colors ${
                      !n.is_read ? 'bg-ob-purple/5' : ''
                    } ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Notification summary — clickable to expand */}
                    <div
                      onClick={() => toggleExpand(n.id)}
                      className="px-4 py-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        {!n.is_read && <div className="w-2 h-2 bg-ob-purple rounded-full mt-1.5 flex-shrink-0" />}
                        {n.is_read && <div className="w-2 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!n.is_read ? 'text-ob-navy font-semibold' : 'text-gray-700 font-medium'}`}>
                            {n.title || n.message}
                          </p>
                          {n.message && n.title !== n.message && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                          )}
                          <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded detail — stays on same page */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-white rounded-lg border border-gray-100 p-4 ml-5">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {n.message || n.title || 'No details available'}
                          </p>
                          {n.entity_type && (
                            <p className="text-xs text-gray-400 mt-2">
                              Type: <span className="font-medium text-gray-500">{n.entity_type}</span>
                            </p>
                          )}
                          {n.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleDateString('en-NG', { 
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          )}
                          <p className="text-xs text-ob-purple mt-2 font-medium">
                            {actionInfo.label}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {notifications.length > 10 ? `Showing 10 of ${notifications.length} notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
