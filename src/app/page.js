import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import StatsSection from '@/components/StatsSection';

export default function Home() {
  return (
    <>
      {/* ========================================
          SECTION 01 — HERO
          ======================================== */}
      <section className="bg-ob-navy relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-ob-purple/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-ob-lime/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ob-purple/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" duration={800}>
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="inline-block bg-ob-purple/20 text-ob-lime text-sm font-medium px-4 py-1.5 rounded-full border border-ob-purple/30">
                    The Marketplace of Tomorrow
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    The Smart Bridge Between{' '}
                    <span className="text-ob-lime">Suppliers</span> &{' '}
                    <span className="text-ob-lime">Global Shoppers</span>
                  </h1>
                  <p className="text-gray-300 text-lg leading-relaxed max-w-lg">
                    Discover quality products from trusted vendors, shop securely and grow your business through one connected marketplace.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link href="/shop" className="btn-primary text-lg px-8 py-4 glow-lime">
                    Start Shopping
                  </Link>
                  <Link href="/for-suppliers" className="btn-secondary text-lg px-8 py-4">
                    Become a Vendor
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  {[
                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Verified Vendors' },
                    { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'Secure Payments (Powered by Paystack)' },
                    { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Orders Tracked' },
                    { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', text: 'Buyer Protection' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-ob-lime" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={item.icon} clipRule="evenodd" />
                      </svg>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" duration={800} delay={200}>
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/hero.jpg"
                    alt="OjaBridge — The smart bridge between suppliers and global shoppers"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-ob-purple text-white px-6 py-3 rounded-xl shadow-lg hidden lg:block animate-float">
                  <p className="text-sm font-medium">Shop • Connect • Grow</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 02 — TRUST STRIP
          ======================================== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Verified Vendors', desc: 'Every vendor is verified' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Secure Payments', desc: 'Powered by Paystack' },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Orders Tracked', desc: 'From purchase to delivery' },
              { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', title: 'Buyer Protection', desc: 'We protect every transaction' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="text-ob-purple flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-ob-navy text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 03 — HOW IT WORKS — STAIRCASE (6 Steps)
          ======================================== */}
      <section className="section-padding bg-white" id="how-it-works">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Simple Process</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                How It Works
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Simple steps, seamless experience — from placing your order to getting paid
              </p>
            </div>
          </ScrollReveal>

          {/* Staircase Layout */}
          <div className="relative max-w-4xl mx-auto">
            {/* Vertical connecting line (desktop only) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-ob-purple/20 via-ob-purple/10 to-ob-lime/20 -translate-x-1/2" />

            {[
              { step: 1, title: 'Place Your Order', desc: 'Choose your products and place your order securely', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-ob-purple/10 text-ob-purple border-ob-purple/20', numberColor: 'bg-ob-purple text-white' },
              { step: 2, title: 'Order Confirmed', desc: 'We confirm your payment and notify the vendor', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-blue-50 text-blue-600 border-blue-200', numberColor: 'bg-blue-600 text-white' },
              { step: 3, title: 'Vendor Prepares', desc: 'The vendor prepares and packages your order', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'bg-amber-50 text-amber-600 border-amber-200', numberColor: 'bg-amber-500 text-white' },
              { step: 4, title: 'Order Shipped', desc: 'Your order is on its way with real-time tracking', icon: 'M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', numberColor: 'bg-indigo-600 text-white' },
              { step: 5, title: 'Order Delivered', desc: 'Your order arrives safely at your doorstep', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', color: 'bg-teal-50 text-teal-600 border-teal-200', numberColor: 'bg-teal-600 text-white' },
              { step: 6, title: 'Vendor Gets Paid', desc: 'After delivery confirmation, vendor payment is processed', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-ob-lime/10 text-ob-lime-dark border-ob-lime/30', numberColor: 'bg-ob-lime text-ob-navy' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 120}>
                <div className={`relative flex items-center gap-6 lg:gap-12 mb-12 last:mb-0 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Step number circle — center on desktop, left on mobile */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 rounded-full ${item.numberColor} flex items-center justify-center font-bold text-sm shadow-md`}>
                      {item.step}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 lg:w-[calc(50%-3rem)] ${idx % 2 === 0 ? 'lg:pr-16' : 'lg:pl-16'}`}>
                    <div className={`flex items-start gap-4 p-5 rounded-xl border ${item.color} hover:shadow-md transition-shadow`}>
                      <div className="lg:hidden w-10 h-10 rounded-full bg-ob-purple text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-ob-navy text-base mb-1">{item.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Empty spacer for alternating layout */}
                  <div className="hidden lg:block flex-1 lg:w-[calc(50%-3rem)]" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 04 — FOR SUPPLIERS (Clean CTA)
          ======================================== */}
      <section className="py-20 bg-ob-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-ob-purple/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-ob-lime/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="space-y-6">
                <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">For Suppliers</span>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Start <span className="text-ob-lime">Selling?</span>
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Join hundreds of trusted vendors on OjaBridge and reach more customers.
                </p>
                <div className="space-y-3">
                  {[
                    'Reach more customers',
                    'Secure & fast payments',
                    'Business growth supports',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-ob-lime/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-ob-lime" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/for-suppliers" className="inline-flex items-center gap-2 bg-white text-ob-navy font-semibold px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors mt-4">
                  Apply to Become a Vendor
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/vendor.jpg"
                  alt="OjaBridge vendor — manage your business from anywhere"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 05 — HOW TO BECOME A VENDOR (Clean Steps)
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Get Started in Just 4 Simple Steps</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                How to Become a Vendor
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: 1, title: 'Register & Apply', desc: 'Create your account and begin the vendor application', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              { step: 2, title: 'Verify Business', desc: 'Complete required KYC/KYB and business verification', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { step: 3, title: 'Set Up Your Store', desc: 'Add store details, products and required information', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { step: 4, title: 'Start Selling', desc: 'Your store goes live and you start receiving orders', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div className="relative p-6 rounded-xl border border-gray-100 bg-white hover:shadow-lg hover:border-ob-purple/20 transition-all text-center group">
                  <div className="w-14 h-14 bg-ob-purple/10 rounded-xl flex items-center justify-center text-ob-purple mx-auto mb-4 group-hover:bg-ob-purple group-hover:text-white transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-ob-purple font-bold text-xs uppercase tracking-wider">Step {item.step}</span>
                  <h3 className="font-bold text-ob-navy mt-2 mb-2 text-base">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 06 — VERIFIED VENDORS / KYC
          ======================================== */}
      <section className="section-padding bg-ob-light">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/vendor-kyc.jpg"
                  alt="OjaBridge vendor identity verification — KYC process"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Trust & Verification</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  Verified Vendors.{' '}
                  <span className="text-ob-purple">Greater Trust.</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Every vendor on OjaBridge goes through identity and business verification before receiving full marketplace privileges.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Verified Identity', desc: 'Government-issued ID verification' },
                    { title: 'Verified Business', desc: 'Business registration confirmed' },
                    { title: 'Verified Settlement', desc: 'Bank account ownership verified' },
                    { title: 'Ongoing Monitoring', desc: 'Continuous trust assessment' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-ob-lime-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h4 className="font-semibold text-ob-navy text-sm">{item.title}</h4>
                      </div>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 07 — SECURE PAYMENTS
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Secure Checkout</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  Pay Securely.{' '}
                  <span className="text-ob-purple">Every Time.</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Your payment is processed securely while OjaBridge keeps every transaction traceable. Nigeria-first launch with NGN support.
                </p>
                <div className="flex items-center space-x-4 bg-ob-light rounded-xl p-4 border border-gray-100">
                  <div className="flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-500">Payments powered by</span>
                    <p className="text-lg font-bold text-ob-navy">Paystack</p>
                  </div>
                  <div className="flex-1 border-l border-gray-200 pl-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>PCI DSS compliant</span>
                      <span className="text-gray-300">•</span>
                      <span>256-bit SSL encryption</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/secure-payment.jpg"
                  alt="OjaBridge secure payment — powered by Paystack"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 08 — BUYER PROTECTION
          ======================================== */}
      <section className="section-padding bg-ob-light">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/buyer-protection.jpg"
                  alt="OjaBridge buyer protection"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Your Protection</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  We Protect the Transaction.
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  OjaBridge is designed to support customers when problems occur — from disputes and refund requests to delivery issues.
                </p>
                <div className="space-y-3">
                  {[
                    { title: 'Secure Transactions', desc: 'Every payment is encrypted and protected.' },
                    { title: 'Authentic Products', desc: 'Products come from verified and trusted vendors.' },
                    { title: 'Easy Returns', desc: 'We make returns simple and stress-free.' },
                    { title: '24/7 Support', desc: 'Our support team is always here to help you.' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-4 bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-ob-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-ob-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ob-navy text-sm">{item.title}</h4>
                        <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 09 — SECURITY ARCHITECTURE
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Security Architecture</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                Security Built Into the Platform
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Security is not an afterthought. Every interaction is designed with security at its core.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Account Security', desc: 'Strong authentication, MFA support, session management.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              { title: 'Payment Verification', desc: 'Server-side payment verification and webhook validation.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { title: 'Fraud Prevention', desc: 'Risk detection, suspicious activity monitoring.', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
              { title: 'Data Protection', desc: 'Encryption at rest, secure key management.', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
              { title: 'Access Controls', desc: 'Role-based permissions and zero-trust validation.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
              { title: 'Audit Trails', desc: 'Every action is logged and timestamped.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div className="bg-ob-light p-6 rounded-xl border border-gray-100 card-hover h-full">
                  <div className="w-12 h-12 bg-ob-purple/10 rounded-xl flex items-center justify-center text-ob-purple mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <h3 className="font-bold text-ob-navy mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 10 — LIVE STATS
          ======================================== */}
      <StatsSection />

      {/* ========================================
          SECTION 11 — FINAL CTA
          ======================================== */}
      <section className="section-padding bg-ob-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-ob-purple/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-ob-lime/5 rounded-full blur-3xl" />
        </div>
        <div className="container-custom text-center relative z-10">
          <ScrollReveal animation="scale-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
              Join a growing community of vendors, retailers and customers building the future of trusted commerce.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/shop" className="btn-primary text-lg px-8 py-4 glow-lime">
                Start Shopping
              </Link>
              <Link href="/for-suppliers" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-ob-purple">
                Become a Vendor
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
