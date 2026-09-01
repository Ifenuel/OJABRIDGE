import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Why Choose OjaBridge', href: '/why-choose' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/support' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund-policy' },
    { name: 'Shipping Policy', href: '/shipping-policy' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Buyer Protection', href: '/buyer-protection' },
  ];

  const supplierLinks = [
    { name: 'Become a Vendor', href: '/for-suppliers' },
    { name: 'Vendor Standards', href: '/vendor-standards' },
    { name: 'Prohibited Products', href: '/prohibited-products' },
    { name: 'Acceptable Use', href: '/acceptable-use' },
    { name: 'Security', href: '/security' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z', comingSoon: true },
    { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', comingSoon: true },
    { name: 'Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 3h11A3.5 3.5 0 0121 6.5v11a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 013 17.5v-11A3.5 3.5 0 016.5 3z', comingSoon: true },
    { name: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z', comingSoon: true },
  ];

  return (
    <footer className="bg-ob-navy text-white">
      {/* Trust Bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: '🔒', title: 'Secure & Encrypted', desc: 'Bank-level security' },
              { icon: '💳', title: 'Split Payment System', desc: 'Suppliers paid directly' },
              { icon: '🛡️', title: 'Buyer Protection', desc: 'Funds held until delivery' },
              { icon: '🌍', title: 'Global Payments', desc: 'NGN, USD, EUR & GBP' },
              { icon: '🎧', title: '24/7 Support', desc: 'Always ready to help' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Logo size="default" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              The trusted bridge connecting suppliers, retailers and customers through secure, transparent and reliable digital commerce.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <div key={social.name} className="relative group">
                  <button
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-ob-purple/60 transition-colors cursor-default"
                    aria-label={social.name}
                    title={`${social.name} — Coming Soon`}
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                    </svg>
                  </button>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ob-navy text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Coming Soon
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-ob-lime text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-ob-lime text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Supplier Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">For Suppliers</h4>
            <ul className="space-y-2.5">
              {supplierLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-ob-lime text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} OjaBridge. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 text-xs">Accepted Payment Methods:</span>
              <div className="flex items-center space-x-3">
                {['VISA', 'MC', 'Paystack', 'Verve'].map((method) => (
                  <span
                    key={method}
                    className="bg-white/10 px-3 py-1 rounded text-xs font-medium text-gray-300"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
