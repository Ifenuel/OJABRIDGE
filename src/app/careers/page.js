import Link from 'next/link';

export const metadata = {
  title: 'Careers — OjaBridge',
  description: 'Join OjaBridge and help build the future of trusted digital commerce connecting suppliers, retailers and customers across Africa and beyond.',
};

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Join Our Team</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Build the Future of <span className="text-ob-lime">Commerce</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            We&apos;re creating a marketplace where trust, technology and opportunity meet. Join us in shaping how suppliers, retailers and customers connect through secure digital commerce.
          </p>
        </div>
      </section>

      {/* Mission & Culture */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-2xl font-bold text-ob-navy mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                OjaBridge exists to become the trusted bridge between suppliers, retailers and customers — enabling secure, transparent and reliable digital commerce. We believe that when businesses and consumers can transact with confidence, entire economies grow stronger.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ob-navy mb-4">Our Culture</h2>
              <p className="text-gray-600 leading-relaxed">
                We are building something significant — not just a marketplace, but a platform rooted in trust. Our team values integrity, craftsmanship, accountability and the kind of professional excellence that earns long-term respect. We work hard, we think carefully and we build things that matter.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-ob-navy mb-8 text-center">What We Stand For</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Trust First', desc: 'Every feature we build reinforces the trust between vendors and customers.', icon: '🤝' },
                { title: 'Security Always', desc: 'We protect user data, payments and business information with the highest standards.', icon: '🔒' },
                { title: 'Real Growth', desc: 'We create tools that help vendors genuinely grow their businesses.', icon: '📈' },
                { title: 'Professional Excellence', desc: 'We hold ourselves to the standard our users deserve — every day.', icon: '⭐' },
              ].map((value, i) => (
                <div key={i} className="bg-ob-light p-6 rounded-2xl border border-gray-100">
                  <span className="text-3xl block mb-3">{value.icon}</span>
                  <h3 className="font-bold text-ob-navy mb-2">{value.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Look For */}
      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-4 text-center">Who We&apos;re Looking For</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            OjaBridge is looking for professionals who are serious about building trustworthy technology and meaningful digital commerce infrastructure.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-3">Technology & Engineering</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Backend engineers who understand secure systems, databases and API architecture
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Frontend developers who care about professional UI, accessibility and performance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  DevOps and infrastructure professionals who understand uptime, security and scale
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  QA and security-minded professionals who protect what we build
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-3">Business & Operations</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Marketplace operations professionals who understand vendor management and fulfillment
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Customer support leaders who build systems that genuinely help people
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Finance and compliance professionals who understand payments and regulatory requirements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Marketing and growth professionals who build honest brand presence
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-3">Product & Design</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Product designers who think in terms of trust, clarity and professional craftsmanship
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  UX researchers who understand marketplace behaviour and vendor workflows
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Brand designers who can maintain visual consistency across a growing platform
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-ob-navy mb-3">Growth & Partnerships</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Business development professionals who build relationships with vendors and suppliers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Partnerships professionals who understand logistics, payments and technology integrations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ob-purple mt-1">•</span>
                  Community managers who can build genuine relationships with vendors and customers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ob-navy mb-8 text-center">Why OjaBridge</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: 'Meaningful Work', desc: 'You won&apos;t just write code — you&apos;ll build infrastructure that connects real businesses with real customers through trusted commerce.' },
              { title: 'Early-Stage Impact', desc: 'Join early enough that your contributions genuinely shape the platform, the culture and the direction of the company.' },
              { title: 'Growth Environment', desc: 'As OjaBridge grows, the people building it grow with it — professionally, technically and commercially.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-ob-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-ob-purple text-xl font-bold">{i + 1}</span>
                </div>
                <h3 className="font-bold text-ob-navy mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-ob-navy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Interested in Working With Us?</h2>
          <p className="text-gray-300 mb-8">
            Send your CV and a brief note about why you&apos;d be a strong fit for OjaBridge to our careers team. We review every application personally.
          </p>
          <div className="bg-white/10 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-gray-300 text-sm mb-2">Send applications to:</p>
            <p className="text-ob-lime font-semibold text-lg">awoyoemmanuel12@gmail.com</p>
            <p className="text-gray-400 text-xs mt-2">Send your application and enquiry to this email</p>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            OjaBridge is an equal opportunity employer. We value diversity and are committed to creating an inclusive environment for all team members.
          </p>
        </div>
      </section>
    </>
  );
}
