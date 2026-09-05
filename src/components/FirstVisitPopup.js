'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';

/**
 * FirstVisitPopup — Premium welcome popup for first-time visitors.
 * Modern, circular/oval design with email capture and role selection.
 * Respects dismissal via sessionStorage.
 */
export default function FirstVisitPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('welcome'); // 'welcome' | 'role'

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
      {/* Backdrop — deep navy overlay with blur */}
      <div className="absolute inset-0 bg-ob-navy/70 backdrop-blur-md" onClick={dismiss} />

      {/* Outer circle decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

      {/* Modal — Oval/Circular shape */}
      <div className="relative w-full max-w-[440px]">
        {/* Close button — floating outside modal */}
        <button
          onClick={dismiss}
          className="absolute -top-3 -right-3 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/60 hover:text-white transition-all border border-white/20"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Main card — oval shape with glass effect */}
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-ob-purple/5" />

          {/* Content */}
          <div className="relative px-8 pt-10 pb-8 text-center">
            {/* Logo */}
            <div className="mb-5">
              <Logo size="small" />
            </div>

            {step === 'welcome' ? (
              /* STEP 1 — Welcome + Email Capture */
              <>
                {/* Headline — Bold, elegant serif-inspired styling */}
                <h2 className="text-[32px] font-extrabold text-ob-navy leading-tight tracking-tight mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Welcome to<br />
                  <span className="text-ob-purple">OjaBridge</span>
                </h2>

                <p className="text-gray-500 text-sm mb-1 leading-relaxed max-w-[300px] mx-auto">
                  Nigeria&apos;s trusted marketplace connecting<br />verified vendors with smart shoppers.
                </p>

                <p className="text-ob-purple/60 text-xs font-medium mb-6">
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
                    className="w-full px-5 py-3.5 bg-gray-100/80 border border-gray-200 rounded-2xl text-sm text-ob-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ob-purple/30 focus:border-ob-purple transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full mt-3 bg-ob-purple hover:bg-ob-purple-dark text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-ob-purple/20 hover:shadow-ob-purple/30 text-sm tracking-wide"
                  >
                    Get 5% Off Your First Order →
                  </button>
                </form>

                <p className="text-[10px] text-gray-300 mb-4">
                  Join 10,000+ smart shoppers · Secure payments · Verified vendors
                </p>

                <button
                  onClick={dismiss}
                  className="text-gray-400 hover:text-gray-600 text-xs font-medium underline underline-offset-2 transition-colors"
                >
                  No, thanks
                </button>
              </>
            ) : (
              /* STEP 2 — Choose Your Role */
              <>
                <h2 className="text-[26px] font-extrabold text-ob-navy leading-tight tracking-tight mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  How will you<br />
                  <span className="text-ob-purple">use OjaBridge?</span>
                </h2>

                <p className="text-gray-400 text-xs mb-6">
                  Choose how you&apos;d like to get started
                </p>

                {/* Role Cards */}
                <div className="space-y-3 mb-6">
                  {[
                    { icon: '🛒', label: 'Shop & Buy', desc: 'Browse products from verified vendors', href: '/register?role=customer', color: 'from-blue-500 to-blue-600', ring: 'ring-blue-200' },
                    { icon: '📦', label: 'Retail & Source', desc: 'Source products for your business', href: '/register?role=retailer', color: 'from-green-500 to-green-600', ring: 'ring-green-200' },
                    { icon: '🏪', label: 'Sell & Grow', desc: 'List products and reach more customers', href: '/register?role=vendor', color: 'from-ob-purple to-purple-600', ring: 'ring-purple-200' },
                  ].map((r, i) => (
                    <Link
                      key={i}
                      href={r.href}
                      onClick={dismiss}
                      className={`flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-ob-purple/20 hover:shadow-lg hover:${r.ring} hover:ring-2 transition-all group bg-white`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                        <span className="text-xl">{r.icon}</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-bold text-ob-navy group-hover:text-ob-purple transition-colors">{r.label}</p>
                        <p className="text-xs text-gray-400">{r.desc}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-ob-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/register"
                  onClick={dismiss}
                  className="block w-full text-center bg-ob-navy hover:bg-ob-navy/90 text-white font-semibold py-3 rounded-2xl transition-all text-sm"
                >
                  Create Account →
                </Link>

                <button
                  onClick={dismiss}
                  className="text-gray-400 hover:text-gray-600 text-xs font-medium underline underline-offset-2 transition-colors mt-3"
                >
                  Browse as Guest
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
