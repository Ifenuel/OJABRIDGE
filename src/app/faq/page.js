'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What is OjaBridge?',
    answer: 'OjaBridge is a multi-vendor marketplace connecting verified suppliers, retailers and customers through a trusted digital commerce platform. We provide the infrastructure that makes marketplace commerce safer, easier and more organized.',
  },
  {
    question: 'Is OjaBridge free to use?',
    answer: 'Customers can browse and shop on OjaBridge. The platform\'s business model includes a 10% commission on successful transactions, with applicable payment and marketplace terms clearly presented where relevant.',
  },
  {
    question: 'How does OjaBridge work?',
    answer: 'Vendors provide products, customers discover and purchase them, and OjaBridge provides the marketplace infrastructure for verification, checkout, order management, fulfillment coordination, protection and support.',
  },
  {
    question: 'Are OjaBridge vendors verified?',
    answer: 'Yes. Vendors are designed to undergo appropriate KYC/KYB and verification processes before receiving full marketplace publishing privileges. This includes identity verification, business verification and settlement account verification.',
  },
  {
    question: 'How are payments handled?',
    answer: 'Payments are processed through secure payment infrastructure, with Paystack currently planned as the payment provider. All transactions are encrypted and verified server-side before orders are confirmed.',
  },
  {
    question: 'What currencies does OjaBridge support?',
    answer: 'The initial architecture supports NGN (Nigerian Naira), USD (US Dollar), EUR (Euro) and GBP (British Pound Sterling), with additional currencies possible as the platform expands.',
  },
  {
    question: 'Can I become a vendor?',
    answer: 'Yes. Vendors can apply, complete the required verification process and create their OjaBridge store once approved. The process includes identity verification, business information and settlement account setup.',
  },
  {
    question: 'Can I use OjaBridge as a retailer?',
    answer: 'Where retailer sourcing functionality is enabled, retailers can discover products from participating vendors and source products for resale through their own channels.',
  },
  {
    question: 'Can I track my order?',
    answer: 'Yes. OjaBridge provides order status and delivery tracking throughout the fulfillment process, from order confirmation through vendor preparation, shipping and delivery.',
  },
  {
    question: 'What happens if I have a problem with an order?',
    answer: 'Customers can contact support and, where applicable, open a dispute or request a refund according to the relevant policy. Our buyer protection program is designed to help resolve issues fairly.',
  },
  {
    question: 'Does OjaBridge own the products?',
    answer: 'No. OjaBridge is designed as a marketplace. Vendors provide the products listed through their stores; OjaBridge provides the marketplace infrastructure.',
  },
  {
    question: 'How do I contact support?',
    answer: 'You can reach our support team through the Help Center on our website. We aim to provide responsive support for all customer, vendor and retailer inquiries.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Support</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Frequently Asked <span className="text-ob-lime">Questions</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Find answers to common questions about OjaBridge — how it works, payments, vendor verification and more.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-ob-navy pr-4">{faq.question}</h3>
                  <svg
                    className={`w-5 h-5 text-ob-purple flex-shrink-0 transition-transform duration-200 ${
                      openIndex === idx ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === idx && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding bg-ob-light text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help. Reach out and we&apos;ll get back to you as soon as possible.
          </p>
          <a href="mailto:support@ojabridge.com" className="btn-primary inline-block">
            Contact Support
          </a>
          <p className="text-gray-400 text-xs mt-3">Or email us directly at <a href="mailto:support@ojabridge.com" className="text-ob-purple hover:underline">support@ojabridge.com</a></p>
        </div>
      </section>
    </>
  );
}
