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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ojabridge_currency') || 'NGN';
    return 'NGN';
  });
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyRef = useRef(null);
  const { user, isAuthenticated, logout, isAdmin, isVendor } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', active: true },
    { code: 'USD', symbol: '$', name: 'US Dollar', comingSoon: true },
    { code: 'EUR', symbol: '€', name: 'Euro', comingSoon: true },
    { code: 'GBP', symbol: '£', name: 'British Pound', comingSoon: true },
  ];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Categories', href: '/categories' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'For Suppliers', href: '/for-suppliers' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const dashboardLink = isAdmin ? '/admin-dashboard' : isVendor ? '/vendor-dashboard' : user?.role === 'retailer' ? '/retailer-dashboard' : null;

  // Load notifications from API
  useEffect(() => {
    if (isAuthenticated && user) {
      fetch('/api/notifications', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success) setNotifications(data.notifications || []);
        })
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
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search handler with debounced API call
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
      if (data.success) {
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
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
    }
  };

  // Notification helpers
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
    } catch (err) {}
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
    } catch (err) {}
  };

  const notifIcon = (type) => {
    switch (type) {
      case 'order_confirmed': return '✅';
      case 'order_shipped': return '🚚';
      case 'order_delivered': return '📦';
      case 'order_processing': return '⏳';
      case 'payment_success': return '💳';
      case 'payment_failed': return '❌';
      case 'vendor_approved': return '🎉';
      case 'kyc_update': return '📋';
      case 'security_alert': return '🔒';
      case 'review': return '⭐';
      case 'settlement': return '💰';
      case 'refund': return '🔄';
      case 'announcement': return '📢';
      default: return '🔔';
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo size="default" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-ob-purple font-medium transition-colors duration-200 text-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6" ref={searchRef}>
            <div className="relative w-full">
              <form onSubmit={submitSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                  placeholder="Search products, brands, stores..."
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 transition-all duration-200 text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-hidden">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" />
                      <p className="text-gray-400 text-sm mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="overflow-y-auto max-h-80">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/shop/product/${product.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                        >
                          <div className="w-10 h-10 bg-ob-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ob-navy truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.vendor_profiles?.store_name || product.vendor_name || 'Vendor'}</p>
                          </div>
                          <span className="text-sm font-bold text-ob-navy whitespace-nowrap">
                            {product.currency === 'NGN' ? '₦' : product.currency}{Number(product.price).toLocaleString()}
                          </span>
                        </Link>
                      ))}
                      <Link
                        href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        className="block px-4 py-3 text-center text-ob-purple text-sm font-medium hover:bg-gray-50"
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                      >
                        View all results →
                      </Link>
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 text-sm">No products found for &quot;{searchQuery}&quot;</p>
                      <Link
                        href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        className="text-ob-purple text-sm font-medium hover:underline mt-1 block"
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                      >
                        Browse shop →
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Currency Dropdown */}
            <div className="relative" ref={currencyRef}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCurrencyDropdown(prev => !prev); }}
                className="flex items-center text-xs sm:text-sm text-gray-600 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 cursor-pointer hover:border-ob-purple transition-colors"
              >
                <span className="font-medium">{currencies.find(c => c.code === selectedCurrency)?.symbol}{' '}{selectedCurrency}</span>
                <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCurrencyDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[170px]">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      disabled={!!c.comingSoon}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!c.comingSoon) {
                          setSelectedCurrency(c.code);
                          localStorage.setItem('ojabridge_currency', c.code);
                        }
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${
                        c.comingSoon
                          ? 'text-gray-400 cursor-not-allowed opacity-60'
                          : selectedCurrency === c.code
                            ? 'text-ob-purple font-semibold bg-ob-purple/5 hover:bg-ob-purple/10'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold mr-2 w-5 text-center">{c.symbol}</span>
                      <span>{c.code}</span>
                      <span className="text-gray-400 text-xs ml-2">{c.name}</span>
                      {c.comingSoon ? (
                        <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Soon</span>
                      ) : selectedCurrency === c.code ? (
                        <svg className="w-4 h-4 ml-auto text-ob-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Favorites / Heart */}
            <Link href="/favorites" className="hidden sm:flex p-2 text-gray-600 hover:text-ob-purple transition-colors" aria-label="Favorites">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Notifications Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-ob-purple transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-ob-navy text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-ob-purple font-medium hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-80">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <p className="text-gray-400 text-sm">No notifications yet</p>
                            <p className="text-gray-300 text-xs mt-1">Order updates will appear here</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => markNotifRead(notif.id)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                !notif.is_read ? 'bg-ob-purple/5' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">{notifIcon(notif.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-ob-navy">{notif.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(notif.created_at).toLocaleString()}
                                  </p>
                                </div>
                                {!notif.is_read && (
                                  <div className="w-2 h-2 bg-ob-purple rounded-full mt-2 flex-shrink-0" />
                                )}
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
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-ob-purple transition-colors" aria-label="Cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-ob-lime text-ob-navy text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{itemCount > 99 ? '99+' : itemCount}</span>}
            </Link>

            {/* User Account / Login */}
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-ob-purple rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-ob-navy">{user.name?.split(' ')[0]}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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

                      <Link href="/shop" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>
                        Shop
                      </Link>
                      <Link href="/favorites" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>
                        My Favorites
                      </Link>
                      <Link href="/contact" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ob-purple" onClick={() => setIsUserMenuOpen(false)}>
                        Help & Support
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button 
                          onClick={() => { logout(); setIsUserMenuOpen(false); }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:flex p-2 text-gray-600 hover:text-ob-purple transition-colors" aria-label="Account">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <Link href="/register" className="hidden md:inline-flex bg-ob-purple hover:bg-ob-purple-dark text-white font-medium px-5 py-2 rounded-lg transition-all duration-200 text-sm">
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile Menu */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-600 hover:text-ob-purple" aria-label="Menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3">
            <form onSubmit={(e) => { submitSearch(e); setIsMenuOpen(false); }}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-full bg-gray-50 text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
          </div>
          <div className="px-2 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-ob-purple rounded-lg text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated && dashboardLink && (
              <Link
                href={dashboardLink}
                className="block px-4 py-2.5 text-ob-purple bg-ob-purple/5 rounded-lg text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {isAdmin ? 'Admin Dashboard' : 'Vendor Dashboard'}
              </Link>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-2 py-2">
                  <div className="w-10 h-10 bg-ob-purple rounded-full flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ob-navy">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full text-center py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link href="/login" className="flex-1 text-center py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-ob-purple" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/register" className="flex-1 text-center py-2.5 btn-primary text-sm" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
