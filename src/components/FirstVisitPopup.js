'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';

/**
 * FirstVisitPopup — Shows on first visit to welcome new visitors
 * and encourage account creation. Respects dismissal via sessionStorage.
 * 
 * Design: Light, clean, professional — NOT deep purple.
 */
export default function FirstVisitPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('ojabridge-welcome-dismissed');
    if (!wasDismissed) {
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-gray-700 transition-colors shadow-sm"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header — Light, clean, professional */}
        <div className="bg-gradient-to-br from-white via-purple-50/50 to-green-50/30 px-8 pt-8 pb-6 text-center border-b border-gray-100">
          <div className="mb-3">
            <Logo size="default" />
          </div>
          <p className="text-ob-purple/70 text-xs font-semibold uppercase tracking-[3px] mt-3">Welcome</p>
          <h2 className="text-2xl font-bold text-ob-navy mt-2">
            Shop <span className="text-ob-purple">·</span> Connect <span className="text-ob-lime-dark">·</span> Grow
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
            Join thousands of buyers and sellers on Nigeria&apos;s trusted multi-vendor marketplace. Secure payments, verified vendors, and buyer protection.
          </p>

          {/* Role Cards — Light background */}
          <div className="space-y-2.5 mb-6">
            {[
              { icon: '🛒', label: 'Customer', desc: 'Browse & buy from verified vendors', color: 'bg-blue-50' },
              { icon: '📦', label: 'Retailer', desc: 'Source products for your business', color: 'bg-green-50' },
              { icon: '🏪', label: 'Vendor', desc: 'Sell your products to thousands', color: 'bg-purple-50' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 ${r.color} rounded-xl`}>
                <span className="text-lg">{r.icon}</span>
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
            Get Started — It&apos;s Free
          </Link>

          <button
            onClick={dismiss}
            className="block w-full text-center text-gray-400 hover:text-gray-600 text-sm font-medium py-3 mt-1 transition-colors"
          >
            Maybe Later
          </button>

          <p className="text-center text-[10px] text-gray-300 mt-3">
            Secure · Verified Vendors · Buyer Protection
          </p>
        </div>
      </div>
    </div>
  );
}
