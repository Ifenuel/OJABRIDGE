'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const { user, isAuthenticated, logout, isAdmin, isVendor } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const dashboardLink = isAdmin ? '/admin-dashboard' : isVendor ? '/vendor-dashboard' : user?.role === 'retailer' ? '/retailer-dashboard' : null;

  // Scroll detection for sticky shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      fetch('/api/notifications', { credentials: 'include' })
        .then(r => r.json())
        .then(data => { if (data.success) setNotifications(data.notifications || []); })
        .catch(() => {});
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Search handler
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
      const data = await res.json();
      setSearchResults(data.success ? (data.results || []) : []);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markNotifRead = async (notifId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: [notifId] }),
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
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

  // Navigation menu items for the hamburger drawer
  const menuLinks = [
    { name: 'Home', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Shop', href: '/shop', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17' },
    { name: 'Categories', href: '/categories', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'How It Works', href: '/how-it-works', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'For Suppliers', href: '/for-suppliers', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'About', href: '/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Contact', href: '/contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'Blog', href: '/blog', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  ];

  return (
    <>
      <nav className={`bg-white sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md border-b border-gray-100' : 'border-b border-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[68px]">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Logo size="default" />
            </Link>

            {/* Desktop: Right controls — compact */}
            <div className="flex items-center gap-2">
              {/* Favourites */}
              <Link href="/favorites" className="hidden sm:flex p-2.5 text-gray-500 hover:text-ob-purple transition-colors rounded-full hover:bg-gray-50" aria-label="Favorites">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 text-gray-500 hover:text-ob-purple transition-colors rounded-full hover:bg-gray-50"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-semibold text-ob-navy text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-ob-purple font-medium hover:underline">Mark all read</button>
                          )}
                        </div>
                        <div className="overflow-y-auto max-h-80">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-gray-400 text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.slice(0, 10).map((notif) => (
                              <button
                                key={notif.id}
                                onClick={() => markNotifRead(notif.id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-ob-purple/5' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-lg mt-0.5">{notifIcon(notif.type)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-ob-navy">{notif.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                  </div>
                                  {!notif.is_read && <div className="w-2 h-2 bg-ob-purple rounded-full mt-2 flex-shrink-0" />}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative p-2.5 text-gray-500 hover:text-ob-purple transition-colors rounded-full hover:bg-gray-50" aria-label="Cart">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-ob-lime text-ob-navy text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px]">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Search Icon Button */}
              <button
                onClick={() => { setIsSearchOpen(!isSearchOpen); setIsMenuOpen(false); }}
                className={`p-2.5 rounded-full transition-colors ${isSearchOpen ? 'bg-ob-purple text-white' : 'text-gray-500 hover:text-ob-purple hover:bg-gray-50'}`}
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => { setIsMenuOpen(!isMenuOpen); setIsSearchOpen(false); }}
                className={`p-2.5 rounded-full transition-colors ${isMenuOpen ? 'bg-ob-navy text-white' : 'text-gray-500 hover:text-ob-navy hover:bg-gray-50'}`}
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Account / Sign In */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-ob-purple rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-ob-navy">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        {dashboardLink ? (
                          <Link href={dashboardLink} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>
                            {isAdmin ? 'Admin Dashboard' : isVendor ? 'Vendor Dashboard' : 'Retailer Dashboard'}
                          </Link>
                        ) : (
                          <Link href="/account" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>
                            My Account
                          </Link>
                        )}
                        <Link href="/shop" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>Shop</Link>
                        <Link href="/favorites" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>My Favorites</Link>
                        <Link href="/contact" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>Help & Support</Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hidden sm:flex items-center gap-2 bg-ob-purple hover:bg-ob-purple-dark text-white font-medium px-4 py-2 rounded-lg transition-all text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search Overlay — expands below navbar */}
        {isSearchOpen && (
          <div className="border-t border-gray-100 bg-white shadow-lg" ref={searchRef}>
            <div className="max-w-3xl mx-auto px-4 py-4">
              <form onSubmit={submitSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products, brands, stores..."
                  className="w-full px-5 py-3.5 pl-12 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 transition-all text-base"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>

              {/* Search Results */}
              {showSearchResults && (
                <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-lg max-h-80 overflow-hidden">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin h-5 w-5 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" />
                      <p className="text-gray-400 text-sm mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="overflow-y-auto max-h-72">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/shop/product/${product.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          onClick={() => { setShowSearchResults(false); setSearchQuery(''); setIsSearchOpen(false); }}
                        >
                          <div className="w-10 h-10 bg-ob-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ob-navy truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.vendor_profiles?.store_name || 'Vendor'}</p>
                          </div>
                          <span className="text-sm font-bold text-ob-navy whitespace-nowrap">
                            {product.currency === 'NGN' ? '₦' : product.currency}{Number(product.price).toLocaleString()}
                          </span>
                        </Link>
                      ))}
                      <Link
                        href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        className="block px-4 py-3 text-center text-ob-purple text-sm font-medium hover:bg-gray-50"
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); setIsSearchOpen(false); }}
                      >
                        View all results →
                      </Link>
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 text-sm">No products found for &quot;{searchQuery}&quot;</p>
                      <Link href={`/shop?search=${encodeURIComponent(searchQuery)}`} className="text-ob-purple text-sm font-medium hover:underline mt-1 block" onClick={() => { setShowSearchResults(false); setSearchQuery(''); setIsSearchOpen(false); }}>
                        Browse shop →
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hamburger Menu — Full-screen slide-in drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            ref={menuRef}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto"
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <Logo size="small" />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info if authenticated */}
            {isAuthenticated && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ob-purple rounded-full flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ob-navy">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                {dashboardLink && (
                  <Link
                    href={dashboardLink}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-ob-purple text-white rounded-lg text-sm font-medium hover:bg-ob-purple-dark transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    {isAdmin ? 'Admin Dashboard' : isVendor ? 'Vendor Dashboard' : 'Retailer Dashboard'}
                  </Link>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="px-4 py-4">
              <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Navigation</p>
              {menuLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-ob-purple/5 hover:text-ob-purple rounded-xl text-sm font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                  </svg>
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Quick Links */}
            <div className="px-4 py-4 border-t border-gray-100">
              <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Links</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'FAQ', href: '/faq' },
                  { name: 'Help Center', href: '/support' },
                  { name: 'Terms', href: '/terms' },
                  { name: 'Privacy', href: '/privacy' },
                  { name: 'Careers', href: '/careers' },
                  { name: 'Press', href: '/press' },
                ].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-ob-purple rounded-lg text-sm transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Actions */}
            <div className="px-4 py-4 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="flex-1 text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-ob-purple hover:text-ob-purple transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center py-3 bg-ob-purple text-white rounded-xl text-sm font-medium hover:bg-ob-purple-dark transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Footer branding */}
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Shop • Connect • Grow</p>
            </div>
          </div>
        </>
      )}

      {/* Slide-in animation keyframes */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}
