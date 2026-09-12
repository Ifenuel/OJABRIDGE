'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/context/AuthContext';

export default function MobileHeader({ onMenuOpen, role }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const roleLabel = role === 'admin' ? 'Admin' : role === 'vendor' ? 'Vendor' : role === 'retailer' ? 'Retailer' : 'Customer';

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-3 py-2.5 flex items-center justify-between shadow-sm">
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="p-2 -ml-2 text-gray-600 hover:text-ob-purple transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <Link href="/" className="flex-shrink-0">
        <Logo size="small" />
      </Link>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={() => { /* profile click could open dropdown if needed */ }}
          className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors"
          title={`${user?.name || 'User'} — ${roleLabel}`}
        >
          <div className="w-7 h-7 bg-ob-purple rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="text-xs text-gray-500 truncate max-w-[60px]">{user?.name?.split(' ')[0] || 'User'}</span>
        </button>
      </div>
    </header>
  );
}
