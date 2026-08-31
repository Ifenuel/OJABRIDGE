'use client';

import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-ob-navy to-ob-navy-light text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ob-lime text-sm font-semibold tracking-wider uppercase mb-4">Trust & Security</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Security Built Into the Platform</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">Security is not an afterthought. Every important interaction is designed with protection at its core.</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🔐',
                title: 'Account Security',
                desc: 'Strong authentication, multi-factor authentication support, session management and login monitoring help protect your account.',
              },
              {
                icon: '💳',
                title: 'Payment Verification',
                desc: 'All payments are processed through Paystack with server-side verification, webhook validation and transaction reconciliation.',
              },
              {
                icon: '🛡️',
                title: 'Fraud Prevention',
                desc: 'Risk detection, suspicious transaction monitoring and automated threat assessment help keep the marketplace safe.',
              },
              {
                icon: '🔒',
                title: 'Data Protection',
                desc: 'Sensitive personal and financial information is encrypted and protected following industry best practices.',
              },
              {
                icon: '👥',
                title: 'Access Controls',
                desc: 'Role-based permissions and authorization checks ensure users can only access information and features they are permitted to use.',
              },
              {
                icon: '📋',
                title: 'Audit Trails',
                desc: 'Every important action is logged, timestamped and available for investigation when needed.',
              },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-bold text-ob-navy text-lg mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ob-light py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-6 text-center">How We Protect You</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              '256-bit SSL encryption for all data in transit',
              'Secure, HTTP-only session cookies',
              'Server-side payment verification for all transactions',
              'Brute force protection on authentication endpoints',
              'Rate limiting on sensitive operations',
              'Regular security audits and monitoring',
              'Separation of sensitive data from public access',
              'Tamper-resistant audit logging',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ob-navy text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Found a security concern?</h2>
          <p className="text-gray-300 mb-8">If you believe you have found a security vulnerability or have a security concern, please contact us immediately.</p>
          <Link href="/contact" className="btn-primary text-center inline-block">Report a Security Issue</Link>
        </div>
      </section>
    </div>
  );
}
