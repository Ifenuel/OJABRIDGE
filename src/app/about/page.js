import Link from 'next/link';

export const metadata = {
  title: 'About Us — OjaBridge',
  description: 'Learn about OjaBridge — the trusted bridge between suppliers, retailers and customers.',
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">About OjaBridge</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            A Trusted Bridge Between<br />
            <span className="text-ob-lime">Suppliers, Retailers & Customers</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Building the future of connected, trustworthy commerce across markets, currencies and opportunities.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-ob-navy mb-6">Who We Are</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            OjaBridge is a multi-vendor marketplace designed to connect suppliers, retailers and customers through trusted digital commerce infrastructure. We provide the platform, verification systems, secure payments, order management, fulfillment coordination and customer protection that makes marketplace commerce safer and more organized.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            We do not own or warehouse the products listed by vendors. Instead, we build and maintain the infrastructure that helps verified businesses reach customers across markets and borders.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Motto */}
      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Our Mission',
              content: 'To make commerce more connected, trustworthy and accessible by giving suppliers, retailers and customers a secure marketplace where they can discover opportunities, transact with confidence and grow together.',
            },
            {
              title: 'Our Vision',
              content: 'To become a trusted global commerce bridge connecting businesses and consumers across markets, currencies and opportunities.',
            },
            {
              title: 'Our Brand Promise',
              content: 'A trusted bridge between suppliers, retailers and customers.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-ob-purple mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed italic">&ldquo;{item.content}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Motto */}
      <section className="py-16 bg-ob-purple text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-wider">
            SHOP • CONNECT • GROW
          </h2>
          <p className="text-white/70 text-lg mt-4">
            The three pillars that define every interaction on OjaBridge.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-ob-navy mb-12 text-center">Our Principles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Trust', desc: 'Verified vendors and traceable transactions.' },
              { title: 'Security', desc: 'Defense-in-depth architecture. Never trust the client.' },
              { title: 'Transparency', desc: 'Customers see exactly what they are paying.' },
              { title: 'Fairness', desc: 'Clear rights and responsibilities for all parties.' },
              { title: 'Privacy', desc: 'Collect only necessary information. Protect sensitive data.' },
              { title: 'Accountability', desc: 'Every important action is auditable.' },
              { title: 'Financial Integrity', desc: 'Every naira, dollar, euro and pound must be traceable.' },
              { title: 'Scalability', desc: 'Architecture that supports growing users and markets.' },
              { title: 'Accessibility', desc: 'Excellent experience on smartphones, tablets and computers.' },
              { title: 'Resilience', desc: 'Graceful handling of failures, outages and unexpected errors.' },
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-ob-light rounded-xl border border-gray-100">
                <h4 className="font-bold text-ob-navy mb-2">{item.title}</h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-ob-navy text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Join OjaBridge Today</h2>
          <p className="text-gray-300 mb-8">
            Whether you&apos;re a vendor looking to reach more customers or a shopper seeking quality products from trusted sources, OjaBridge is built for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop" className="btn-primary">Start Shopping</Link>
            <Link href="/for-suppliers" className="btn-secondary">Become a Vendor</Link>
          </div>
        </div>
      </section>
    </>
  );
}
