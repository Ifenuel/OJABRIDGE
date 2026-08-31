'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', userType: 'customer', subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.errors?.[0] || data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setSending(false);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Get in Touch</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Contact <span className="text-ob-lime">OjaBridge</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Whether you&apos;re a customer, vendor, retailer, partner or member of the press — we&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="section-padding bg-ob-light">
        <div className="max-w-6xl mx-auto">
          {/* Contact Categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { title: 'Customer Support', desc: 'Orders, payments, refunds, account issues', icon: '👤', contact: 'awoyoemmanuel12@gmail.com' },
              { title: 'Vendor Support', desc: 'Onboarding, KYC, store, settlements', icon: '🏪', contact: 'awoyoemmanuel12@gmail.com' },
              { title: 'Business Enquiries', desc: 'Partnerships, integrations, corporate', icon: '💼', contact: 'awoyoemmanuel12@gmail.com' },
              { title: 'Press & Media', desc: 'Interviews, press releases, media kits', icon: '📰', contact: 'awoyoemmanuel12@gmail.com' },
              { title: 'Careers', desc: 'Job applications, team enquiries', icon: '🚀', contact: 'awoyoemmanuel12@gmail.com' },
              { title: 'General Enquiries', desc: 'Feedback, questions, everything else', icon: '💬', contact: 'awoyoemmanuel12@gmail.com' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className="font-bold text-ob-navy mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{item.desc}</p>
                <p className="text-ob-purple font-semibold text-sm">{item.contact}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100">
              <h2 className="text-xl font-bold text-ob-navy mb-6">Send Us a Message</h2>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-ob-lime/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-ob-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-ob-navy mb-2">Message Sent</h3>
                  <p className="text-gray-500 text-sm">Thank you for reaching out. We will respond to your enquiry as soon as possible.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-6 text-ob-purple font-semibold text-sm hover:underline">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                    <select value={formData.userType} onChange={e => setFormData({...formData, userType: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm text-gray-600">
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor / Supplier</option>
                      <option value="retailer">Retailer</option>
                      <option value="partner">Business Partner</option>
                      <option value="press">Press / Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm" placeholder="How can we help?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea rows={5} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none text-sm resize-none" placeholder="Tell us more about your enquiry..." />
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary w-full py-3 disabled:opacity-50">
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Details */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100">
                <h2 className="text-xl font-bold text-ob-navy mb-6">Contact Information</h2>
                <div className="space-y-5">
                  {[
                    { label: 'General Email', value: 'awoyoemmanuel12@gmail.com', icon: '📧' },
                    { label: 'Phone', value: '09161291454', icon: '📞' },
                    { label: 'Business Address', value: 'Alabidun, Airport-Alakia, Ibadan, Oyo State', icon: '📍' },
                    { label: 'Working Hours', value: 'Monday — Friday, 9:00 AM — 6:00 PM (WAT)', icon: '🕐' },
                  ].map((info, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-xl mt-0.5">{info.icon}</span>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{info.label}</p>
                        <p className="text-ob-navy font-medium">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-ob-navy mb-3">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Help Center', href: '/support' },
                    { name: 'FAQ', href: '/faq' },
                    { name: 'Privacy Policy', href: '/privacy' },
                    { name: 'Terms of Service', href: '/terms' },
                  ].map((link, i) => (
                    <a key={i} href={link.href} className="block text-ob-purple hover:underline text-sm font-medium py-1">
                      {link.name} →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
