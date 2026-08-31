import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'For Suppliers — OjaBridge',
  description: 'Sell through OjaBridge — create your verified storefront and reach more customers.',
};

export default function ForSuppliersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">For Suppliers & Vendors</span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                Sell Through <span className="text-ob-lime">OjaBridge</span>
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Put your products in front of more customers. Create your verified storefront, manage your inventory, receive orders and grow your business through a trusted marketplace.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#register" className="btn-primary text-lg px-8 py-4">
                  Apply to Become a Vendor
                </a>
                <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-ob-navy">
                  Learn How It Works
                </a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl hidden lg:block">
              <Image
                src="/images/vendor.jpg"
                alt="OjaBridge vendor managing their business"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Why Sell on OjaBridge</span>
            <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3">
              Everything You Need to Grow
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Zero Hidden Fees',
                desc: 'Clear and transparent 10% commission on successful transactions. No surprise charges.',
                icon: '💰',
              },
              {
                title: 'Real-Time Earnings',
                desc: 'Track every sale, commission and settlement in real time through your vendor dashboard.',
                icon: '📊',
              },
              {
                title: 'Wide Customer Reach',
                desc: 'Access a growing marketplace of customers actively looking for quality products.',
                icon: '🌍',
              },
              {
                title: 'Secure & Reliable',
                desc: 'Payments processed securely through Paystack with verified settlement to your account.',
                icon: '🔒',
              },
              {
                title: 'Vendor Support',
                desc: 'Dedicated support to help you set up, manage and grow your OjaBridge store.',
                icon: '🎧',
              },
              {
                title: 'Analytics & Insights',
                desc: 'Detailed sales analytics, product performance metrics and customer insights.',
                icon: '📈',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-gray-100 card-hover">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="font-bold text-ob-navy text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Getting Started</span>
            <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3">
              How to Become a Vendor
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Register & Apply',
                desc: 'Create your account and submit your vendor application with business details.',
              },
              {
                step: '02',
                title: 'Verify Your Identity',
                desc: 'Complete KYC/KYB verification — identity, business and settlement information.',
              },
              {
                step: '03',
                title: 'Create Your Store',
                desc: 'Set up your storefront, add products, set prices and configure shipping.',
              },
              {
                step: '04',
                title: 'Start Selling',
                desc: 'Receive orders, fulfill shipments and track earnings through your dashboard.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center card-hover">
                <div className="w-14 h-14 bg-ob-purple text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-ob-navy text-lg mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KYC Section */}
      <section id="kyc" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/vendor-kyc.jpg"
              alt="OjaBridge vendor identity verification"
              width={800}
              height={600}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="space-y-6">
            <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Verification Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
              Vendor Verification & KYC
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              OjaBridge requires vendors to complete appropriate verification before publishing products. This protects customers and helps create a more trustworthy marketplace for everyone.
            </p>
            <div className="space-y-4">
              {[
                { title: 'Personal Information', desc: 'Full legal name, contact details and residential address.' },
                { title: 'Identity Verification', desc: 'Government-issued ID and identity verification through approved providers.' },
                { title: 'Business Information', desc: 'Business name, type, registration and address details.' },
                { title: 'Settlement Account', desc: 'Verified bank account for receiving vendor settlements.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-ob-purple/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-ob-purple" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ob-navy text-sm">{item.title}</h4>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bank Verification */}
      <section id="fees" className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">Secure Settlements</span>
            <h2 className="text-3xl md:text-4xl font-bold text-ob-navy">
              Verified Settlement.{' '}
              <span className="text-ob-purple">Financial Confidence.</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Your settlement information is verified and protected. OjaBridge ensures vendor settlements are associated with verified identities and appropriate financial verification.
            </p>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h4 className="font-bold text-ob-navy mb-4">Commission Structure</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Platform Commission</span>
                  <span className="font-bold text-ob-purple">10%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Vendor Allocation</span>
                  <span className="font-bold text-ob-lime-dark">90%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 text-sm">Example: ₦50,000 sale</span>
                  <div className="text-right">
                    <span className="text-sm text-gray-400">Commission: ₦5,000</span>
                    <br />
                    <span className="font-bold text-ob-navy">Vendor: ₦45,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/bank-verification.jpg"
              alt="OjaBridge bank verification and secure settlement"
              width={800}
              height={600}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-ob-purple text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Selling?</h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of vendors building their businesses on OjaBridge. Apply today and start reaching customers across markets.
          </p>
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            Apply to Become a Vendor
          </Link>
        </div>
      </section>
    </>
  );
}
