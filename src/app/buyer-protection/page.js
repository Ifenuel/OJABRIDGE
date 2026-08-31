'use client';

import Link from 'next/link';

export default function BuyerProtectionPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-ob-navy to-ob-navy-light text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ob-lime text-sm font-semibold tracking-wider uppercase mb-4">Protection</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Buyer Protection</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">We don&apos;t just help you buy. We protect the transaction.</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-ob-navy mb-6">What Buyer Protection Covers</h2>
              <div className="space-y-4">
                {[
                  { title: 'Non-Delivery', desc: 'If your product is not delivered within the promised timeframe, you can open a dispute for a review.' },
                  { title: 'Wrong Product', desc: 'If you receive an item that is materially different from what was described and ordered.' },
                  { title: 'Damaged Product', desc: 'If your item arrives damaged or defective, you can submit evidence for review.' },
                  { title: 'Missing Items', desc: 'If your order is incomplete and items are missing from the delivery.' },
                  { title: 'Material Mismatch', desc: 'If the product significantly differs from the listing description, images or specifications.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ob-navy text-sm">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-ob-navy mb-6">How It Works</h2>
              <div className="space-y-6">
                {[
                  { num: '1', title: 'Contact the Vendor First', desc: 'Most issues can be resolved directly with the vendor through OjaBridge messaging.' },
                  { num: '2', title: 'Open a Dispute', desc: 'If the vendor cannot resolve the issue, open a formal dispute through your account.' },
                  { num: '3', title: 'Submit Evidence', desc: 'Provide photographs, order details and a description of the issue.' },
                  { num: '4', title: 'Platform Review', desc: 'OjaBridge reviews the evidence from both parties and makes a determination.' },
                  { num: '5', title: 'Resolution', desc: 'Possible outcomes include full refund, partial refund, return-and-refund or dispute dismissal.' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-ob-purple text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{step.num}</div>
                    <div>
                      <h4 className="font-semibold text-ob-navy text-sm">{step.title}</h4>
                      <p className="text-gray-500 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-ob-light p-6 rounded-xl">
                <h3 className="font-bold text-ob-navy mb-2">Important Notes</h3>
                <ul className="text-gray-500 text-sm space-y-2">
                  <li>• Buyer Protection applies to completed transactions through OjaBridge</li>
                  <li>• Claims must be submitted within [NUMBER] days of delivery</li>
                  <li>• Evidence must support the claimed issue</li>
                  <li>• OjaBridge does not guarantee automatic refunds — all disputes are reviewed individually</li>
                  <li>• fraudulent claims may result in account restriction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ob-navy text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need help with an order?</h2>
          <p className="text-gray-300 mb-8">Our support team is here to assist you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support" className="btn-primary text-center">Visit Help Center</Link>
            <Link href="/contact" className="btn-secondary text-center">Contact Support</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
