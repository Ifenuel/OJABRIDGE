import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function Home() {
  return (
    <>
      {/* ========================================
          SECTION 01 — HERO (IMAGE 01)
          ======================================== */}
      <section className="bg-ob-navy relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-ob-purple/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-ob-lime/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ob-purple/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Headline & CTA */}
            <ScrollReveal animation="fade-right" duration={800}>
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="inline-block bg-ob-purple/20 text-ob-lime text-sm font-medium px-4 py-1.5 rounded-full border border-ob-purple/30 animate-fade-in">
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
                    { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'Secure Payments' },
                    { icon: 'M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z', text: 'Real-time Tracking' },
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

            {/* Right — Hero Image */}
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
                {/* Floating accent badge */}
                <div className="absolute -bottom-6 -left-6 bg-ob-purple text-white px-6 py-3 rounded-xl shadow-lg hidden lg:block animate-float">
                  <p className="text-sm font-medium">Shop • Connect • Grow</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 02 — TRUST STRIP (Animated Counters)
          ======================================== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Verified Vendors', desc: 'Every vendor is verified', counter: { target: 0, suffix: '+', label: '' } },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Secure Payments', desc: 'Powered by Paystack', counter: { target: 0, suffix: '', label: '100%' } },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Orders Tracked', desc: 'From purchase to delivery', counter: { target: 0, suffix: '+', label: '' } },
              { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', title: 'Buyer Protection', desc: 'We protect every transaction', counter: { target: 0, suffix: '%', label: '' } },
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
          SECTION 02B — OJABRIDGE OVERALL SUMMARY (INFOGRAPHIC)
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-10">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Complete Overview</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                OjaBridge at a Glance
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about OjaBridge — our brand, ecosystem, business model, trust & security, and our promise to vendors, retailers and customers — in one comprehensive view.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale-in" delay={200}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
              <Image
                src="/images/ojabridge-summary.jpg"
                alt="OjaBridge Complete Overview — Brand, Ecosystem, Business Model, Trust and Security"
                width={1400}
                height={800}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            <p className="text-center text-gray-400 text-sm mt-4">
              Our brand identity, ecosystem roles, business model, supported currencies, trust & security architecture, and key vision stats
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================
          SECTION 03 — WHAT IS OJABRIDGE + ECOSYSTEM (IMAGE 12)
          ======================================== */}
      <section className="section-padding bg-ob-light" id="how-it-works">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">How It All Works</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                One Bridge. Three Powerful Roles.
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                OjaBridge connects suppliers, retailers and customers through a trusted marketplace designed for secure, transparent commerce.
              </p>
            </div>
          </ScrollReveal>

          {/* Ecosystem Image */}
          <ScrollReveal animation="scale-in">
            <div className="rounded-2xl overflow-hidden shadow-xl mb-16">
              <Image
                src="/images/ecosystem.jpg"
                alt="OjaBridge Ecosystem — Suppliers, Platform, and Customers connected"
                width={1200}
                height={675}
                className="w-full h-auto object-cover"
              />
            </div>
          </ScrollReveal>

          {/* Three Roles */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: 'Vendors',
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                description: 'Provide products and manage their businesses through verified storefronts on OjaBridge.',
              },
              {
                role: 'OjaBridge',
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                description: 'Provides marketplace infrastructure, verification, secure payments, order management and operational oversight.',
              },
              {
                role: 'Customers',
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                description: 'Discover, compare and purchase products securely with full buyer protection and order tracking.',
              },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 150}>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 card-hover h-full">
                  <div className="w-16 h-16 bg-ob-purple/10 rounded-xl flex items-center justify-center text-ob-purple mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-ob-navy mb-3">{item.role}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 04 — HOW IT WORKS (5-step flow)
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Simple Process</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                How It Works
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Simple steps to a secure shopping experience
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { step: '01', title: 'Discover', desc: 'Find products and verified vendors', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { step: '02', title: 'Choose', desc: 'Compare products, prices and reviews', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { step: '03', title: 'Pay Securely', desc: 'Checkout through secure payment processing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
              { step: '04', title: 'Fulfill', desc: 'Vendors process and ship your order', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { step: '05', title: 'Receive & Review', desc: 'Get your order and share your experience', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 120}>
                <div className="text-center relative">
                  {idx < 4 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-ob-purple/30 to-ob-purple/10" />
                  )}
                  <div className="w-16 h-16 bg-ob-purple/10 rounded-2xl flex items-center justify-center text-ob-purple mx-auto mb-4 relative z-10 bg-white shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-ob-purple font-bold text-sm">Step {item.step}</span>
                  <h3 className="font-bold text-ob-navy mt-1 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 05 — SHOPPING EXPERIENCE (IMAGE 09)
          ======================================== */}
      <section className="section-padding bg-ob-light">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/shopping-experience.jpg"
                  alt="OjaBridge shopping experience — discover, shop and connect on any device"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Marketplace</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  Discover. Shop. Connect.
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Everything you want to shop for, connected in one place. Browse categories, discover deals from verified vendors and enjoy a seamless shopping experience across all your devices.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'Product Search', 'Category Browse', 'Flash Deals',
                    'Top Rated Products', 'New Arrivals', 'Verified Vendors',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-ob-lime flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/shop" className="btn-primary inline-block mt-4">
                  Explore Marketplace
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 06 — FOR SUPPLIERS (IMAGE 02)
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">For Vendors</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  Sell Through <span className="text-ob-purple">OjaBridge</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Put your products in front of more customers. Create your verified storefront, manage inventory, receive orders and grow your business through a trusted marketplace.
                </p>
                <div className="space-y-3">
                  {[
                    'Create your verified store',
                    'Upload and manage products',
                    'Receive and fulfill orders',
                    'Track sales and analytics',
                    'Receive secure settlements',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-ob-lime/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-ob-lime-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/for-suppliers" className="btn-primary inline-block mt-4">
                  Become a Vendor
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left">
              <div className="rounded-2xl overflow-hidden shadow-xl">
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
          SECTION 07 — VERIFIED VENDORS / KYC (IMAGE 03)
          ======================================== */}
      <section className="section-padding bg-ob-navy text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
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

            <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
              <div className="space-y-6">
                <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Trust & Verification</span>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Verified Vendors.{' '}
                  <span className="text-ob-lime">Greater Trust.</span>
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Every vendor on OjaBridge goes through appropriate identity and business verification processes before receiving full marketplace privileges. This helps create a more trustworthy shopping experience.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Verified Identity', desc: 'Government-issued ID verification' },
                    { title: 'Verified Business', desc: 'Business registration confirmed' },
                    { title: 'Verified Settlement', desc: 'Bank account ownership verified' },
                    { title: 'Ongoing Monitoring', desc: 'Continuous trust assessment' },
                  ].map((item, idx) => (
                    <ScrollReveal key={idx} animation="scale-in" delay={idx * 100}>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <h4 className="font-semibold text-ob-lime text-sm">{item.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 08 — VERIFIED VENDOR / PRODUCT TRUST (IMAGE 08)
          ======================================== */}
      <section className="section-padding bg-ob-light">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Shop with Confidence</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  Shop from{' '}
                  <span className="text-ob-purple">Verified Vendors</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Every vendor store shows verification status, ratings and reviews — so you can make informed decisions about who you buy from. Quality products, trusted businesses.
                </p>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-ob-navy">What You See</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      'Verified Vendor badge',
                      'Store rating and reviews',
                      'Product information and pricing',
                      'Shipping and return policies',
                      'Response time and reliability',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-ob-lime/20 rounded-full flex items-center justify-center text-ob-lime-dark text-sm font-bold">✓</span>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/verified-vendor.jpg"
                  alt="OjaBridge verified vendor — shop with confidence from trusted businesses"
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
          SECTION 09 — BANK VERIFICATION / SETTLEMENT (IMAGE 04) 
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/bank-verification.jpg"
                  alt="OjaBridge bank verification — secure vendor settlement"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Secure Settlement</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  Verified Businesses.{' '}
                  <span className="text-ob-purple">Verified Settlement.</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  OjaBridge ensures that vendor settlement information is verified and handled securely. Every payout is associated with a verified vendor identity and appropriate financial verification.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Bank Verification', desc: 'Account ownership confirmed through secure verification' },
                    { title: 'Settlement Account', desc: 'Business accounts only — verified and validated' },
                    { title: 'Payout Protection', desc: 'Funds released only to verified settlement accounts' },
                    { title: 'Transaction Tracing', desc: 'Every payout is logged and traceable for audit' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-ob-light rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
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
                <div className="bg-ob-lime/5 border border-ob-lime/20 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-ob-lime-dark flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-sm text-ob-navy font-medium">Verified businesses. Verified settlement information. Greater financial confidence.</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 10 — SECURE PAYMENTS (IMAGE 05)
          ======================================== */}
      <section className="section-padding bg-ob-light">
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
                  Your payment is processed securely while OjaBridge keeps every transaction traceable. Multi-currency support for NGN, USD, EUR and GBP.
                </p>
                <div className="flex items-center space-x-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
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
                <div className="grid grid-cols-2 gap-3">
                  {['NGN', 'USD', 'EUR', 'GBP'].map((currency) => (
                    <div key={currency} className="bg-white rounded-lg px-4 py-2.5 text-center border border-gray-100 hover:border-ob-purple/30 transition-colors cursor-default">
                      <span className="font-semibold text-ob-navy text-sm">{currency}</span>
                    </div>
                  ))}
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
          SECTION 11 — BUYER PROTECTION (IMAGE 06)
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/buyer-protection.jpg"
                  alt="OjaBridge buyer protection — shop with confidence and peace of mind"
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
                  We Don&apos;t Just Help You Buy.{' '}
                  <span className="text-ob-purple">We Protect the Transaction.</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  OjaBridge is designed to support customers when problems occur — from disputes and refund requests to delivery issues and product concerns.
                </p>
                <div className="space-y-4">
                  {[
                    { title: 'Secure Transactions', desc: 'Every payment is encrypted and protected.' },
                    { title: 'Authentic Products', desc: 'Products come from verified and trusted vendors.' },
                    { title: 'Easy Returns', desc: 'Not satisfied? We make returns simple and stress-free.' },
                    { title: '24/7 Support', desc: 'Our support team is always here to help you.' },
                  ].map((item, idx) => (
                    <ScrollReveal key={idx} animation="fade-left" delay={idx * 100}>
                      <div className="flex items-start space-x-4 bg-ob-light rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
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
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 12 — ORDER & DELIVERY (IMAGE 07)
          ======================================== */}
      <section className="section-padding bg-ob-navy text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/order-fulfillment.jpg"
                  alt="OjaBridge order and delivery — from vendor to your doorstep"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
              <div className="space-y-6">
                <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Order & Delivery</span>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Your Order.{' '}
                  <span className="text-ob-lime">Our Promise.</span>
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  From vendor to your doorstep, OjaBridge coordinates the entire order and fulfillment journey. Track every step in real time.
                </p>
                <div className="space-y-4">
                  {[
                    { step: 'Vendor Prepares', desc: 'Order received and packed with care' },
                    { step: 'Confirmed & Shipped', desc: 'Order verified and dispatched' },
                    { step: 'In Transit', desc: 'On the way to your location' },
                    { step: 'Delivered', desc: 'Successfully delivered to your doorstep' },
                  ].map((item, idx) => (
                    <ScrollReveal key={idx} animation="fade-left" delay={idx * 120}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-ob-lime/20 rounded-full flex items-center justify-center text-ob-lime font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{item.step}</h4>
                          <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 13 — PLATFORM SECURITY (No supplied image)
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Security Architecture</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                Security Built Into the Platform
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Security is not an afterthought. Every important interaction — from account access to payment, fulfillment and administration — is designed with security at its core.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Account Security', desc: 'Strong authentication, MFA support, session management and login monitoring.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              { title: 'Payment Verification', desc: 'Server-side payment verification, webhook validation and transaction reconciliation.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { title: 'Fraud Prevention', desc: 'Risk detection, suspicious transaction monitoring and automated threat assessment.', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
              { title: 'Data Protection', desc: 'Encryption at rest, field-level encryption for sensitive PII, secure key management.', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
              { title: 'Access Controls', desc: 'Role-based permissions, row-level security and zero-trust request validation.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
              { title: 'Audit Trails', desc: 'Every important action is logged, timestamped and available for investigation.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div className="bg-ob-light p-6 rounded-2xl border border-gray-100 card-hover h-full">
                  <div className="w-14 h-14 bg-ob-purple/10 rounded-xl flex items-center justify-center text-ob-purple mb-4">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          SECTION 14 — MARKETPLACE OVERSIGHT (IMAGE 11)
          ======================================== */}
      <section className="section-padding bg-ob-light">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/admin-oversight.jpg"
                  alt="OjaBridge admin dashboard — powerful marketplace oversight and management"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
              <div className="space-y-6">
                <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Marketplace Management</span>
                <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
                  A Marketplace That Is{' '}
                  <span className="text-ob-purple">Actively Managed</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  OjaBridge is not simply a website where strangers upload products. Behind the marketplace is a dedicated operational layer that monitors quality, resolves disputes and maintains platform integrity.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Vendor Management', 'Product Moderation', 'Transaction Monitoring', 'Dispute Resolution',
                    'Analytics & Reporting', 'Security Monitoring', 'Fraud Investigation', 'Communication Systems',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-ob-purple flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 15 — WHY CHOOSE OJABRIDGE
          ======================================== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Why OjaBridge</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
                Why Choose <span className="text-ob-purple">OjaBridge</span>?
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                We make e-commerce safe, simple, and profitable for everyone.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Verified & Trusted', desc: 'Vendors go through appropriate verification processes before publishing products.', color: 'bg-ob-purple/10 text-ob-purple' },
              { title: 'Secure & Transparent', desc: 'Transactions are designed to be traceable and protected with server-side verification.', color: 'bg-ob-lime/10 text-ob-lime-dark' },
              { title: 'Fair & Clear', desc: 'A transparent 10% commission model makes marketplace economics understandable.', color: 'bg-ob-gold/10 text-amber-600' },
              { title: 'Fast & Reliable', desc: 'Order and delivery workflows designed for visibility from purchase through fulfillment.', color: 'bg-blue-50 text-blue-600' },
              { title: 'Global & Multi-Currency', desc: 'Supporting NGN, USD, EUR and GBP with international scalability in mind.', color: 'bg-purple-50 text-purple-600' },
              { title: 'Buyer Protection', desc: 'Dispute, refund and support processes help protect customers throughout.', color: 'bg-green-50 text-green-600' },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                <div className="p-6 rounded-2xl border border-gray-100 card-hover h-full">
                  <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          SECTION 16 — STATS BAR
          ======================================== */}
      <section className="bg-ob-purple py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <ScrollReveal animation="fade-up" delay={0}>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  <AnimatedCounter target={0} suffix="+" />
                </div>
                <p className="text-white/70 text-sm">Verified Vendors</p>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100}>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  <AnimatedCounter target={0} suffix="+" />
                </div>
                <p className="text-white/70 text-sm">Products Listed</p>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={200}>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  <AnimatedCounter target={0} suffix="+" />
                </div>
                <p className="text-white/70 text-sm">Orders Completed</p>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={300}>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  <AnimatedCounter target={0} suffix="%" />
                </div>
                <p className="text-white/70 text-sm">Customer Satisfaction</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 17 — FINAL CTA
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
