import Link from 'next/link';

export const metadata = { title: 'Categories — OjaBridge', description: 'Browse all product categories on OjaBridge marketplace.' };

const categories = [
  { name: 'Fashion', desc: 'Clothing, shoes, bags and accessories', count: '2,400+', color: 'from-purple-500 to-pink-500' },
  { name: 'Electronics', desc: 'Phones, laptops, gadgets and accessories', count: '1,800+', color: 'from-blue-500 to-cyan-500' },
  { name: 'Beauty', desc: 'Skincare, makeup, fragrances and hair care', count: '1,200+', color: 'from-pink-500 to-rose-500' },
  { name: 'Home & Living', desc: 'Furniture, decor, kitchen and household', count: '950+', color: 'from-amber-500 to-orange-500' },
  { name: 'Health', desc: 'Supplements, wellness and health products', count: '780+', color: 'from-green-500 to-emerald-500' },
  { name: 'Accessories', desc: 'Watches, jewelry, bags and tech accessories', count: '650+', color: 'from-indigo-500 to-violet-500' },
  { name: 'Groceries', desc: 'Food, beverages and everyday essentials', count: '520+', color: 'from-lime-500 to-green-500' },
  { name: 'Sports & Outdoors', desc: 'Fitness, outdoor gear and sporting goods', count: '340+', color: 'from-teal-500 to-cyan-500' },
  { name: 'Automotive', desc: 'Car parts, tools and accessories', count: '280+', color: 'from-slate-500 to-gray-500' },
  { name: 'Baby & Kids', desc: 'Toys, clothing and essentials for children', count: '410+', color: 'from-yellow-500 to-amber-500' },
  { name: 'Books & Stationery', desc: 'Books, office supplies and educational materials', count: '190+', color: 'from-red-500 to-pink-500' },
  { name: 'More Categories', desc: 'Explore additional product categories', count: '500+', color: 'from-ob-purple to-ob-purple-light' },
];

export default function CategoriesPage() {
  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Categories</h1>
          <p className="text-gray-300">Browse products by category from verified vendors</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link key={i} href="/shop" className="bg-white p-6 rounded-2xl border border-gray-100 card-hover group">
                <div className={`w-14 h-14 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center mb-4`}>
                  <span className="text-white font-bold text-lg">{cat.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-ob-navy text-lg mb-1 group-hover:text-ob-purple transition-colors">{cat.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{cat.desc}</p>
                <span className="text-ob-purple text-sm font-semibold">{cat.count} products</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
