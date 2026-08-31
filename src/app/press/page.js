import Link from 'next/link';

export const metadata = {
  title: 'Press & Media — OjaBridge',
  description: 'Media resources, press information and company announcements from OjaBridge — the trusted marketplace connecting suppliers, retailers and customers.',
};

export default function PressPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Press &amp; Media</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            OjaBridge in the <span className="text-ob-lime">News</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Media resources, press releases and information about OjaBridge for journalists, editors and media professionals.
          </p>
        </div>
      </section>

      {/* About OjaBridge for Press */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-6">About OjaBridge</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              OjaBridge is a digital marketplace platform designed to become the trusted bridge between suppliers, retailers and customers. The platform provides verified vendor storefronts, secure payment processing, order management, buyer protection and operational marketplace infrastructure.
            </p>
            <p>
              OjaBridge operates on a model where suppliers and vendors can reach customers and retailers through a single connected marketplace — with trust and verification at the centre of every transaction.
            </p>
            <p>
              The platform integrates payment processing through Paystack, implements KYC/KYB verification for vendors, provides order tracking and buyer protection, and maintains a 10% platform commission on vendor transactions.
            </p>
          </div>
        </div>
      </section>

      {/* Key Facts */}
      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-8 text-center">Key Facts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Platform Type', value: 'Multi-vendor digital marketplace' },
              { label: 'Model', value: 'Suppliers → OjaBridge → Retailers & Customers' },
              { label: 'Commission', value: '10% platform commission on vendor transactions' },
              { label: 'Payment Provider', value: 'Paystack' },
              { label: 'Verification', value: 'KYC/KYB for all vendors' },
              { label: 'Buyer Protection', value: 'Full order protection and dispute resolution' },
            ].map((fact, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
                <p className="text-xs text-ob-purple font-semibold uppercase tracking-wider mb-1">{fact.label}</p>
                <p className="text-ob-navy font-medium">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Contact */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-6">Press Contact</h2>
          <p className="text-gray-600 mb-8">
            For media enquiries, interview requests, press kit access or partnership discussions, please contact our press team.
          </p>
          <div className="bg-ob-light rounded-2xl p-8 border border-gray-100">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-ob-purple font-semibold uppercase tracking-wider mb-1">Press Email</p>
                <p className="text-ob-navy font-semibold text-lg">awoyoemmanuel12@gmail.com</p>
                <p className="text-gray-400 text-xs mt-1">Official OjaBridge press contact</p>
              </div>
              <div>
                <p className="text-xs text-ob-purple font-semibold uppercase tracking-wider mb-1">Press Phone</p>
                <p className="text-ob-navy font-semibold">09161291454</p>
              </div>
              <div>
                <p className="text-xs text-ob-purple font-semibold uppercase tracking-wider mb-1">Business Address</p>
                <p className="text-ob-navy font-semibold">Alabidun, Airport-Alakia, Ibadan, Oyo State</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="section-padding bg-ob-light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ob-navy mb-4">Brand Resources</h2>
          <p className="text-gray-600 mb-8">
            For media use. Please use OjaBridge brand assets in accordance with our brand guidelines.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white px-6 py-4 rounded-xl border border-gray-100">
              <p className="font-semibold text-ob-navy text-sm">OjaBridge Logo</p>
              <p className="text-gray-400 text-xs">Available on request</p>
            </div>
            <div className="bg-white px-6 py-4 rounded-xl border border-gray-100">
              <p className="font-semibold text-ob-navy text-sm">Brand Colours</p>
              <p className="text-gray-400 text-xs">Purple, Lime, Navy</p>
            </div>
            <div className="bg-white px-6 py-4 rounded-xl border border-gray-100">
              <p className="font-semibold text-ob-navy text-sm">Press Kit</p>
              <p className="text-gray-400 text-xs">Available on request</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
