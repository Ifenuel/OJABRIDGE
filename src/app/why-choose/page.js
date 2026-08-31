'use client';

import Link from 'next/link';

const reasons = [
  {
    icon: '✅',
    title: 'Verified & Trusted',
    desc: 'Every vendor goes through identity and business verification before publishing products on OjaBridge.',
  },
  {
    icon: '🔒',
    title: 'Secure & Transparent',
    desc: 'All transactions are processed through Paystack with server-side verification, webhook validation and full audit trails.',
  },
  {
    icon: '💰',
    title: 'Fair & Clear',
    desc: 'A transparent 10% platform commission makes marketplace economics understandable for everyone.',
  },
  {
    icon: '📦',
    title: 'Fast & Reliable',
    desc: 'Order and delivery workflows designed for visibility from purchase through fulfillment.',
  },
  {
    icon: '🌍',
    title: 'Global & Multi-Currency',
    desc: 'Supporting NGN, USD, EUR and GBP with international scalability in mind.',
  },
  {
    icon: '🛡️',
    title: 'Buyer Protection',
    desc: 'Dispute resolution, refund processes and support help protect customers throughout their experience.',
  },
];

export default function WhyChoosePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-ob-navy to-ob-navy-light text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ob-lime text-sm font-semibold tracking-wider uppercase mb-4">Why OjaBridge</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Why Choose OjaBridge?</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">We make e-commerce safe, simple, and profitable for everyone.</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reasons.map((r, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">{r.icon}</span>
                <h3 className="font-bold text-ob-navy text-xl mb-3">{r.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ob-navy text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to experience the difference?</h2>
          <p className="text-gray-300 mb-8">Join a growing community building the future of trusted commerce.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary text-center">Start Shopping</Link>
            <Link href="/for-suppliers" className="btn-secondary text-center">Become a Vendor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
