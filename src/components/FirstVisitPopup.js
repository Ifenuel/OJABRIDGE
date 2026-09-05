'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';

/**
 * FirstVisitPopup — Clean, readable welcome popup.
 * Light overlay, high-contrast text, no heavy blur.
 */
export default function FirstVisitPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('welcome');

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('ojabridge-welcome-dismissed');
    if (!wasDismissed) {
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('ojabridge-welcome-dismissed', 'true');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setStep('role');
    }
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Welcome to OjaBridge">
      {/* Backdrop — simple dark overlay, NO blur */}
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />

      {/* Modal — clean white card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-8 pt-10 pb-8 text-center">
          {/* Logo */}
          <div className="mb-5">
            <Logo size="small" />
          </div>

          {step === 'welcome' ? (
            <>
              {/* Headline — bold, dark, readable */}
              <h2 className="text-[28px] font-extrabold text-gray-900 leading-tight mb-2">
                Welcome to<br />
                <span className="text-ob-purple">OjaBridge</span>
              </h2>

              <p className="text-gray-600 text-sm mb-1 leading-relaxed">
                Nigeria&apos;s trusted marketplace connecting<br />verified vendors with smart shoppers.
              </p>

              <p className="text-ob-purple text-xs font-semibold mb-6 tracking-wide">
                Shop · Connect · Grow
              </p>

              {/* Email Input */}
              <form onSubmit={handleEmailSubmit} className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-5 py-3.5 bg-gray-100 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ob-purple/30 focus:border-ob-purple transition-all"
                />
                <button
                  type="submit"
                  className="w-full mt-3 bg-ob-purple hover:bg-ob-purple-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-ob-purple/20 text-sm tracking-wide"
                >
                  Get 5% Off Your First Order →
                </button>
              </form>

              <p className="text-[11px] text-gray-500 mb-4 font-medium">
                Join 10,000+ smart shoppers · Secure payments · Verified vendors
              </p>

              {/* No thanks — visible, readable */}
              <button
                onClick={dismiss}
                className="text-gray-600 hover:text-gray-900 text-sm font-semibold underline underline-offset-4 transition-colors"
              >
                No, thanks
              </button>
            </>
          ) : (
            <>
              {/* Step 2 — Role Selection */}
              <h2 className="text-[24px] font-extrabold text-gray-900 leading-tight mb-1">
                How will you<br />
                <span className="text-ob-purple">use OjaBridge?</span>
              </h2>

              <p className="text-gray-500 text-sm mb-6">
                Choose how you&apos;d like to get started
              </p>

              {/* Role Cards */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: '🛒', label: 'Shop & Buy', desc: 'Browse products from verified vendors', href: '/register?role=customer', color: 'from-blue-500 to-blue-600' },
                  { icon: '📦', label: 'Retail & Source', desc: 'Source products for your business', href: '/register?role=retailer', color: 'from-green-500 to-green-600' },
                  { icon: '🏪', label: 'Sell & Grow', desc: 'List products and reach more customers', href: '/register?role=vendor', color: 'from-purple-500 to-purple-600' },
                ].map((r, i) => (
                  <Link
                    key={i}
                    href={r.href}
                    onClick={dismiss}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-ob-purple/30 hover:shadow-md transition-all group bg-white"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                      <span className="text-lg">{r.icon}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-ob-purple transition-colors">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-ob-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>

              <Link
                href="/register"
                onClick={dismiss}
                className="block w-full text-center bg-ob-navy hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                Create Account →
              </Link>

              <button
                onClick={dismiss}
                className="text-gray-500 hover:text-gray-800 text-sm font-medium underline underline-offset-4 transition-colors mt-3"
              >
                Browse as Guest
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
