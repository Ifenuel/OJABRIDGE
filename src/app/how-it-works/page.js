'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const steps = [
  {
    num: 1,
    title: 'Place Your Order',
    desc: 'Choose your favourite products from verified vendors and place your order securely on OjaBridge.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    num: 2,
    title: 'Secure Payment',
    desc: 'Pay safely through Paystack. Your payment is held securely until you confirm delivery.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    num: 3,
    title: 'Vendor Prepares Order',
    desc: 'The verified vendor receives your order notification and begins preparing your items.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    num: 4,
    title: 'Order Shipped & Tracked',
    desc: 'Your order is shipped and you can track its progress in real-time from your dashboard.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    num: 5,
    title: 'Confirm Delivery',
    desc: 'You receive your order and confirm that everything is satisfactory. Your satisfaction matters.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    num: 6,
    title: 'Vendor Gets Paid',
    desc: 'Once you confirm delivery, the vendor receives their payment minus a small platform fee.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-lime-500',
    lightColor: 'bg-lime-50',
    textColor: 'text-lime-600',
  },
];

const ecosystemRoles = [
  {
    title: 'Customers & Retailers',
    desc: 'Browse thousands of products from verified vendors. Shop with confidence knowing every vendor is KYC-verified and every payment is protected.',
    items: ['Browse & search products', 'Secure Paystack payments', 'Real-time order tracking', 'Buyer protection guarantee'],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    title: 'OjaBridge Platform',
    desc: 'We handle payments, verification, disputes and settlements so you can focus on what matters — great products and happy customers.',
    items: ['KYC/KYB vendor verification', 'Secure payment processing', 'Order & delivery management', 'Dispute resolution'],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    title: 'Vendors',
    desc: 'Set up your store, list products and reach thousands of customers. Get verified, build trust and grow your business on OjaBridge.',
    items: ['Free store setup', 'Product management dashboard', 'Order & inventory tracking', 'Transparent settlement'],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
];

const trustFeatures = [
  { title: 'Verified Vendors', desc: 'Every vendor undergoes KYC/KYB verification', icon: '✓' },
  { title: 'Secure Payments', desc: '256-bit SSL encryption via Paystack', icon: '🔒' },
  { title: 'Buyer Protection', desc: 'Full refund if you\'re not satisfied', icon: '🛡️' },
  { title: '24/7 Support', desc: 'We\'re here to help whenever you need us', icon: '💬' },
];

export default function HowItWorksPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className={`min-h-screen transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Hero */}
      <section className="bg-gradient-to-br from-ob-navy via-ob-navy to-purple-900 py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ob-lime text-sm font-bold tracking-widest uppercase mb-4">How It Works</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Simple steps,<br />seamless experience
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            From browsing to delivery to payment — here&apos;s how OjaBridge protects you every step of the way.
          </p>
        </div>
      </section>

      {/* Staircase / Ladder Flow */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-lime-500 hidden md:block" />

            <div className="space-y-8 md:space-y-0">
              {steps.map((step, i) => (
                <div key={i} className={`relative flex flex-col md:flex-row items-start gap-4 md:gap-8 ${i > 0 ? 'md:mt-0' : ''}`}>
                  {/* Number circle + line connector */}
                  <div className="flex-shrink-0 flex flex-col items-center z-10">
                    <div className={`w-12 h-12 md:w-16 md:h-16 ${step.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                      <span className="text-xl md:text-2xl font-bold">{step.num}</span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 ${step.lightColor} border ${step.color.replace('bg-', 'border-').replace('-500', '-200')} rounded-2xl p-6 md:p-8 md:ml-0 hover:shadow-md transition-all duration-300`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`${step.color} text-white p-2 rounded-xl`}>
                        {step.icon}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion badge */}
            <div className="flex items-center gap-4 mt-8 md:ml-0">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex-1">
                <p className="font-bold text-green-800">Order Complete! 🎉</p>
                <p className="text-green-600 text-sm mt-1">Your order is confirmed and the vendor gets paid. Thank you for shopping on OjaBridge.</p>
              </div>
            </div>
          </div>

          {/* Secured by Paystack */}
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-6 py-3">
              <span className="text-sm text-gray-500">Payments secured by</span>
              <span className="font-extrabold text-ob-navy text-lg tracking-tight">
                <span className="text-green-600">pay</span>stack
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Summary */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-ob-purple text-sm font-bold tracking-widest uppercase mb-3">The OjaBridge Ecosystem</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">How everyone benefits</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              OjaBridge connects verified vendors with customers and retailers through a secure, transparent marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {ecosystemRoles.map((role, i) => (
              <div key={i} className={`${role.bgColor} border ${role.borderColor} rounded-2xl p-6 md:p-8 hover:shadow-md transition-all`}>
                <div className={`${role.color} mb-4`}>{role.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{role.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{role.desc}</p>
                <ul className="space-y-2">
                  {role.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className={`w-4 h-4 ${role.color} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Connection arrows (visual) */}
          <div className="hidden md:flex justify-center items-center gap-4 mt-8">
            <div className="text-center text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full" />
                <span>Customers browse & buy</span>
              </div>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="text-center text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>OjaBridge processes payment</span>
              </div>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="text-center text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full" />
                <span>Vendors fulfill & get paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trustFeatures.map((f, i) => (
              <div key={i} className="text-center p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h4>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-ob-navy to-purple-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-300 mb-8">Join thousands of customers and vendors on OjaBridge.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="bg-ob-lime hover:bg-ob-lime-dark text-ob-navy font-semibold px-8 py-3 rounded-xl transition-all text-center">
              Start Shopping
            </Link>
            <Link href="/register" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold px-8 py-3 rounded-xl transition-all text-center">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
