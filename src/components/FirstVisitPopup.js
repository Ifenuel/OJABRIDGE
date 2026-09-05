'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';

/**
 * FirstVisitPopup — Shows on first visit to welcome new visitors
 * and encourage account creation. Respects dismissal via sessionStorage.
 */
export default function FirstVisitPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before (session only — shows once per session)
    const wasDismissed = sessionStorage.getItem('ojabridge-welcome-dismissed');
    if (!wasDismissed) {
      // Show after 3 seconds to not block initial page load
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('ojabridge-welcome-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Welcome to OjaBridge">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={dismiss} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-ob-navy to-ob-purple p-8 text-center">
          <div className="mb-4">
            <Logo size="default" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to OjaBridge</h2>
          <p className="text-white/80 text-sm">
            Shop • Connect • Grow
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
            Create your account to start buying, selling and growing with trusted marketplace connections.
          </p>

          {/* Role Cards */}
          <div className="space-y-3 mb-6">
            {[
              { icon: '🛒', label: 'Customer', desc: 'Browse & buy from verified vendors' },
              { icon: '📦', label: 'Retailer', desc: 'Source products for your business' },
              { icon: '🏪', label: 'Vendor', desc: 'Sell your products to thousands' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-ob-light rounded-xl">
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-ob-navy">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <Link
            href="/register"
            onClick={dismiss}
            className="block w-full text-center bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold py-3 rounded-xl transition-all"
          >
            Create an OjaBridge Account
          </Link>

          <button
            onClick={dismiss}
            className="block w-full text-center text-gray-500 hover:text-gray-700 text-sm font-medium py-3 mt-2 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
