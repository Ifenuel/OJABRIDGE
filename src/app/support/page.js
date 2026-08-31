'use client';

import { useState } from 'react';
import Link from 'next/link';

const helpCategories = [
  {
    title: 'Customers',
    icon: '👤',
    articles: [
      { q: 'How do I create an account?', a: 'Visit the Sign Up page, enter your details and choose a Customer account. You will receive a verification email to confirm your account before you can start shopping.' },
      { q: 'How do I search for products?', a: 'Use the search bar at the top of any page. You can search by product name, category, vendor or keyword. You can also browse by category on the Shop or Categories pages.' },
      { q: 'How do I place an order?', a: 'Add products to your cart, proceed to checkout, enter your delivery details and complete payment through our secure Paystack payment system. You will receive an order confirmation email immediately after payment.' },
      { q: 'How does payment work?', a: 'Payments are processed securely through Paystack. We support card payments, bank transfers and other Paystack-supported methods. Your payment is verified server-side before an order is confirmed.' },
      { q: 'How do I track my order?', a: 'After your order is shipped, you will receive an email with a tracking link. You can also check your order status through your account. Tracking shows each stage from order placed through to delivery.' },
      { q: 'How does buyer protection work?', a: 'When you pay through OjaBridge, your payment is held securely until you receive your order. If there is a problem — wrong item, damaged product or non-delivery — you can open a dispute and our team will help resolve it.' },
      { q: 'How do I request a refund?', a: 'Go to your order, select the item and choose Request Refund. Provide your reason and any supporting evidence such as photos. Our team will review and coordinate with the vendor. See our full Refund Policy for details.' },
      { q: 'How do I open a dispute?', a: 'If you cannot resolve an issue directly with the vendor, you can open a dispute from your order page. OjaBridge will review the evidence from both parties and make a fair determination.' },
    ],
  },
  {
    title: 'Vendors',
    icon: '🏪',
    articles: [
      { q: 'How do I become a Vendor?', a: 'Visit the For Suppliers page and apply to become a vendor. You will need to complete your profile, verify your identity (KYC) and connect your bank account before you can start selling.' },
      { q: 'What is KYC/KYB?', a: 'Know Your Customer (KYC) and Know Your Business (KYB) verification ensures that every vendor on OjaBridge is a legitimate, verified business. You will need to provide identification documents and business details.' },
      { q: 'How does bank verification work?', a: 'We verify your bank account to ensure settlements go to the correct account. You provide your bank details and we confirm the account holder matches your verified identity.' },
      { q: 'How do I add products?', a: 'From your Vendor Dashboard, go to Products and click Add New Product. Provide product name, description, price, images, stock quantity and category. Products may be reviewed before publishing.' },
      { q: 'How do I manage inventory?', a: 'Your Vendor Dashboard includes an Inventory section where you can track stock levels, update quantities and view inventory history. Stock is automatically reduced when orders are placed.' },
      { q: 'How do I handle orders?', a: 'New orders appear in your Vendor Dashboard. You can view order details, update the order status (processing, shipped, delivered) and add tracking information.' },
      { q: 'How does fulfillment work?', a: 'After receiving an order, process and ship it within the timeframe shown to the customer. Update the order status and add a tracking number so the customer can follow their delivery.' },
      { q: 'How do settlements work?', a: 'OjaBridge charges a 10% platform commission on each successful transaction. The remaining 90% is your payout. Settlements are processed according to the configured settlement schedule. You can view your earnings in the Vendor Dashboard.' },
      { q: 'How do I view analytics?', a: 'Your Vendor Dashboard includes analytics for sales, revenue, orders, product performance and customer activity to help you understand and grow your business.' },
      { q: 'How do reviews work?', a: 'Customers can leave reviews after receiving their orders. Reviews include a rating and optional comment. You can view all reviews in your Vendor Dashboard.' },
    ],
  },
  {
    title: 'Retailers',
    icon: '🏬',
    articles: [
      { q: 'What is the Retailer role?', a: 'Retailers are business buyers who source products from OjaBridge vendors for resale. They can access bulk pricing, sourcing tools and business-focused features.' },
      { q: 'How do I source products?', a: 'Browse the marketplace, filter by category or supplier, compare products and pricing, and place orders directly through the platform.' },
      { q: 'How do I manage my orders?', a: 'Your retailer account provides order history, tracking, purchase analytics and re-ordering functionality.' },
    ],
  },
  {
    title: 'Payments',
    icon: '💳',
    articles: [
      { q: 'What payment methods do you accept?', a: 'We accept debit cards, credit cards (Visa, Mastercard, Verve), bank transfers and other payment methods supported by Paystack.' },
      { q: 'What happens if my payment fails?', a: 'If a payment fails, no money is deducted from your account. You can retry the payment or try a different payment method. If the issue persists, contact support.' },
      { q: 'Why is my payment pending?', a: 'Some payment methods take time to confirm. Bank transfers in particular may take a few hours. Your order will be confirmed automatically once payment is verified.' },
      { q: 'How do refunds work?', a: 'Refunds are processed back to your original payment method. Processing time depends on your bank or payment provider, typically 3-5 business days after approval. See our Refund Policy for full details.' },
      { q: 'Where can I see my transaction history?', a: 'Your account page shows all transactions including payments, refunds and order-related financial activity.' },
    ],
  },
  {
    title: 'Account & Security',
    icon: '🔒',
    articles: [
      { q: 'How do I reset my password?', a: 'Click Forgot Password on the login page, enter your email address and follow the instructions sent to your email to create a new password.' },
      { q: 'How do I enable MFA?', a: 'Two-factor authentication (MFA) can be enabled from your account security settings. Once activated, you will need to enter a verification code in addition to your password when signing in.' },
      { q: 'How do I manage my sessions?', a: 'Your account security settings show all active sessions. You can sign out of individual devices or sign out of all sessions at once.' },
      { q: 'What happens if my account is restricted?', a: 'If your account is restricted, you will receive a notification explaining the reason. Restricted accounts may have limited functionality. Contact support to resolve account restrictions.' },
      { q: 'How does OjaBridge protect my data?', a: 'We use encryption in transit (TLS/SSL), encrypted database storage, role-based access controls and continuous security monitoring. See our Privacy Policy for complete details.' },
    ],
  },
];

export default function SupportPage() {
  const [openCategory, setOpenCategory] = useState(0);
  const [openArticle, setOpenArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = searchQuery.trim()
    ? helpCategories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(
          a => a.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
               a.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.articles.length > 0)
    : helpCategories;

  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Help Center</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            How Can We <span className="text-ob-lime">Help</span>?
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Find answers to common questions about shopping, selling, payments and your account on OjaBridge.
          </p>
          {/* Search */}
          <div className="max-w-lg mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full px-5 py-3 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-ob-lime focus:ring-2 focus:ring-ob-lime/20 outline-none text-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {helpCategories.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setOpenCategory(i); setOpenArticle(null); setSearchQuery(''); }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  openCategory === i && !searchQuery
                    ? 'bg-ob-purple text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple hover:text-ob-purple'
                }`}
              >
                {cat.icon} {cat.title}
              </button>
            ))}
          </div>

          {/* Help Articles */}
          {filteredCategories.map((cat, catIdx) => (
            <div key={catIdx} className="mb-10">
              <h2 className="text-lg font-bold text-ob-navy mb-4 flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span> {cat.title}
              </h2>
              <div className="space-y-3">
                {cat.articles.map((article, artIdx) => {
                  const isOpen = searchQuery || (openCategory === helpCategories.indexOf(cat) && openArticle === artIdx);
                  return (
                    <div key={artIdx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => {
                          setOpenCategory(helpCategories.indexOf(cat));
                          setOpenArticle(isOpen ? null : artIdx);
                        }}
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-ob-navy text-sm pr-4">{article.q}</span>
                        <svg
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 border-t border-gray-50">
                          <p className="text-gray-600 text-sm leading-relaxed pt-3">{article.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {searchQuery && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
              <button onClick={() => setSearchQuery('')} className="text-ob-purple text-sm font-semibold mt-2 hover:underline">
                Clear search
              </button>
            </div>
          )}

          {/* Still Need Help */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center mt-8">
            <h3 className="text-lg font-bold text-ob-navy mb-2">Still Need Help?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is ready to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary px-6 py-2.5">
                Contact Support
              </Link>
              <Link href="/faq" className="btn-secondary px-6 py-2.5">
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
