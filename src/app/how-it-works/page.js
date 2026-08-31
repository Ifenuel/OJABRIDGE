'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const steps = [
  {
    num: '1',
    title: 'Place Your Order',
    desc: 'Choose your favorite products and place your order securely on OjaBridge.',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    badge: (
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
    ),
  },
  {
    num: '2',
    title: 'Secure Payment',
    desc: 'Pay safely with Paystack. Your payment is 100% secure and verified.',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    num: '3',
    title: 'Vendor Prepares Your Order',
    desc: 'The verified vendor prepares and ships your order.',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    num: '4',
    title: 'Fast & Reliable Delivery',
    desc: 'Track your order in real-time until it reaches you.',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    num: '5',
    title: 'Confirm & Enjoy',
    desc: "Confirm that you've received your order and you're satisfied.",
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    badge: (
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
    ),
  },
  {
    num: '6',
    title: 'Vendor Gets Paid',
    desc: 'Once confirmed, the vendor is paid from their earnings. OjaBridge takes a 10% service fee.',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const trustFeatures = [
  {
    icon: (
      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
    ),
    title: 'Secure Payments',
    desc: 'Your payments are protected by Paystack.',
  },
  {
    icon: (
      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      </div>
    ),
    title: 'Verified Vendors',
    desc: 'All vendors are verified for your safety.',
  },
  {
    icon: (
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      </div>
    ),
    title: '24/7 Support',
    desc: "We're here to help you whenever you need us.",
  },
  {
    icon: (
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      </div>
    ),
    title: 'Buyer Protection',
    desc: "Not satisfied? We've got you covered.",
  },
];

export default function HowItWorksPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className={`min-h-screen transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Hero Section — Light background matching the visual */}
      <section className="bg-gray-50 py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-ob-purple text-sm font-bold tracking-widest uppercase mb-4">How It Works</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            Shop with confidence.<br />We&apos;ve got you covered.
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            From secure payment to safe delivery, OjaBridge protects you every step of the way.
          </p>
        </div>
      </section>

      {/* 6-Step Horizontal Flow */}
      <section className="py-12 md:py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Desktop: horizontal row with arrows */}
          <div className="hidden md:flex items-start justify-between gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start flex-1">
                <div className="flex flex-col items-center text-center px-2 flex-1">
                  {/* Icon Circle */}
                  <div className={`relative w-20 h-20 ${step.bgColor} rounded-full flex items-center justify-center mb-4`}>
                    <span className={step.iconColor}>{step.icon}</span>
                    {step.badge}
                  </div>
                  {/* Step Number */}
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-ob-purple text-white rounded-full text-xs font-bold mb-3">
                    {step.num}
                  </span>
                  {/* Title */}
                  <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug">{step.title}</h3>
                  {/* Description */}
                  <p className="text-gray-400 text-xs leading-relaxed max-w-[180px]">{step.desc}</p>
                </div>
                {/* Arrow between steps */}
                {i < steps.length - 1 && (
                  <div className="flex items-center pt-8 px-1 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: 2-column grid */}
          <div className="md:hidden grid grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`relative w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mb-3`}>
                  <span className={step.iconColor}>{step.icon}</span>
                  {step.badge}
                </div>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-ob-purple text-white rounded-full text-xs font-bold mb-2">
                  {step.num}
                </span>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Secured by Paystack badge */}
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-6 py-3">
              <span className="text-sm text-gray-500">Secured by</span>
              <span className="font-extrabold text-ob-navy text-xl tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>
                <span className="text-green-600">pay</span>stack
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features Banner */}
      <section className="bg-gray-50 py-10 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                {f.icon}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{f.title}</h4>
                  <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-8">
            <span className="text-ob-purple font-semibold">OjaBridge</span> connects you to trusted vendors and ensures a safe, smooth shopping experience.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8">Join thousands of customers and vendors on OjaBridge.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary text-center">Start Shopping</Link>
            <Link href="/register" className="btn-secondary text-center">Become a Vendor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
