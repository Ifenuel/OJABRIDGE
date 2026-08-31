import Link from 'next/link';

export const metadata = {
  title: 'Blog & Insights — OjaBridge',
  description: 'Articles, insights and updates about marketplace commerce, vendor growth, payments and technology from the OjaBridge team.',
};

const categories = [
  'All',
  'Marketplace',
  'E-commerce',
  'Vendors',
  'Retail',
  'Entrepreneurship',
  'Secure Commerce',
  'Payments',
  'Technology',
  'Business Growth',
  'OjaBridge Updates',
];

// When articles are published, they will appear here.
// Each article will include: title, excerpt, category, author, date, readTime, slug
const articles = [];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Blog &amp; Insights</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Ideas for <span className="text-ob-lime">Smarter Commerce</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Thoughtful perspectives on marketplace commerce, vendor growth, secure payments, entrepreneurship and the future of digital trade.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
                  cat === 'All'
                    ? 'bg-ob-purple text-white'
                    : 'bg-ob-light text-gray-600 hover:border-ob-purple hover:text-ob-purple border border-transparent'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          {articles.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-ob-purple/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ob-navy mb-3">Articles Coming Soon</h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                The OjaBridge team is preparing insights on marketplace commerce, vendor growth strategies, secure payments and technology trends. Check back soon.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {['Marketplace', 'E-commerce', 'Vendors', 'Payments', 'Technology', 'Business Growth'].map((cat) => (
                  <span key={cat} className="bg-white px-4 py-2 rounded-full text-sm text-gray-500 border border-gray-200">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover group"
                >
                  <div className="aspect-video bg-gradient-to-br from-ob-purple/5 to-ob-lime/5" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-ob-purple bg-ob-purple/10 px-2.5 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-400">{article.readTime}</span>
                    </div>
                    <h3 className="font-bold text-ob-navy mb-2 group-hover:text-ob-purple transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{article.author}</span>
                      <span>{article.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Topics */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ob-navy mb-4">Topics We Write About</h2>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
            OjaBridge insights cover the practical realities of building and operating in digital commerce — from vendor onboarding to secure payments to marketplace growth.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Marketplace', desc: 'Platform dynamics, marketplace models and vendor-customer relationships' },
              { name: 'E-commerce', desc: 'Online selling strategies, trends and practical digital commerce knowledge' },
              { name: 'Vendors', desc: 'Vendor success stories, onboarding tips and store management' },
              { name: 'Payments', desc: 'Payment processing, financial security and transaction transparency' },
              { name: 'Entrepreneurship', desc: 'Building businesses through digital commerce and marketplace participation' },
              { name: 'Technology', desc: 'The technology behind secure, reliable marketplace infrastructure' },
            ].map((topic, i) => (
              <div key={i} className="bg-ob-light p-5 rounded-xl text-left border border-gray-100">
                <h3 className="font-bold text-ob-navy text-sm mb-1">{topic.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{topic.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
