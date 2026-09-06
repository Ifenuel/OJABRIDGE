import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ];

  const discoverLinks = [
    { name: 'Blog', href: '/blog' },
    { name: 'Press', href: '/press' },
    { name: 'Announcements', href: '/announcements' },
  ];

  const supplierLinks = [
    { name: 'Become a Vendor', href: '/for-suppliers' },
    { name: 'Vendor Standards', href: '/vendor-standards' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/support' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Buyer Protection', href: '/buyer-protection' },
  ];

  const legalLinks = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund-policy' },
    { name: 'Shipping Policy', href: '/shipping-policy' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z', url: process.env.NEXT_PUBLIC_FACEBOOK_URL || null },
    { name: 'X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', url: process.env.NEXT_PUBLIC_TWITTER_URL || null },
    { name: 'Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 3h11A3.5 3.5 0 0121 6.5v11a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 013 17.5v-11A3.5 3.5 0 016.5 3z', url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || null },
    { name: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z', url: process.env.NEXT_PUBLIC_LINKEDIN_URL || null },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Trust Bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: '🔒', title: 'Secure & Encrypted', desc: 'Bank-level security' },
              { icon: '💳', title: 'Split Payment', desc: 'Suppliers paid directly' },
              { icon: '🛡️', title: 'Buyer Protection', desc: 'Funds held until delivery' },
              { icon: '🌍', title: 'NGN Payments', desc: 'Paystack-powered' },
              { icon: '🎧', title: '24/7 Support', desc: 'Always ready to help' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-ob-navy">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Logo size="default" />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed mb-5 max-w-xs">
              The trusted bridge connecting suppliers, retailers and customers through secure, transparent and reliable digital commerce.
            </p>
            <div className="flex items-center space-x-2">
              {socialLinks.map((social) => (
                <div key={social.name} className="relative group">
                  {social.url ? (
                    <a href={social.url} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-ob-purple/10 transition-colors"
                      aria-label={social.name}>
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-ob-purple transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                      </svg>
                    </a>
                  ) : (
                    <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center cursor-default" title="Coming Soon">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-ob-navy">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-500 hover:text-ob-purple text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-ob-navy">Discover</h4>
            <ul className="space-y-2">
              {discoverLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-500 hover:text-ob-purple text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Suppliers */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-ob-navy">For Suppliers</h4>
            <ul className="space-y-2">
              {supplierLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-500 hover:text-ob-purple text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-ob-navy">Support & Legal</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-500 hover:text-ob-purple text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li className="pt-1 border-t border-gray-100 mt-1">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                  {legalLinks.map((link) => (
                    <Link key={link.name} href={link.href} className="text-gray-400 hover:text-ob-purple text-xs transition-colors">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} OjaBridge. All rights reserved. Made with ❤️ in Nigeria 🇳🇬
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-300 text-xs">Secure payments via</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-500">Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
